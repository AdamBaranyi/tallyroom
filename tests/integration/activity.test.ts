import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type {
  ActivityChainReport,
  ActivityEvent,
  Customer,
  ListResponse,
} from '@tallyroom/contracts';
import {
  seedClientUser,
  seedWorkspaceWithOwner,
  type SeededWorkspace,
} from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let alpen: SeededWorkspace;
let nordlicht: SeededWorkspace;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  alpen = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });
  nordlicht = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Nordlicht Architektur',
    email: 'owner@nordlicht.test',
  });
});

async function login(account: SeededWorkspace): Promise<TestClient> {
  const client = server.client();
  const csrf = await client.csrfToken();
  const response = await client.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  expect(response.status).toBe(200);
  return client;
}

async function createCustomer(
  client: TestClient,
  workspaceId: string,
  name: string,
): Promise<Customer> {
  const csrf = await client.csrfToken();
  const response = await client.request(`/api/v1/workspaces/${workspaceId}/customers`, {
    method: 'POST',
    csrf,
    body: JSON.stringify({ name }),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Customer;
}

async function listActivity(
  client: TestClient,
  workspaceId: string,
  query = '',
): Promise<ListResponse<ActivityEvent>> {
  const response = await client.request(`/api/v1/workspaces/${workspaceId}/activity${query}`);
  expect(response.status).toBe(200);
  return (await response.json()) as ListResponse<ActivityEvent>;
}

describe('Aktivitätsprotokoll', () => {
  it('zeigt die eigene Handlung mit Person, Objekt und Zeitpunkt', async () => {
    const team = await login(alpen);
    const customer = await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');

    const { data } = await listActivity(team, alpen.workspaceId);
    const entry = data.find((event) => event.entityId === customer.id);

    expect(entry).toBeDefined();
    expect(entry?.action).toBe('customer.created');
    expect(entry?.entityType).toBe('customer');
    expect(entry?.actorName).toBe(alpen.email);
    expect(entry?.metadata).toEqual({ name: 'Seeblick GmbH' });
    expect(entry?.sealed).toBe(true);
  });

  it('filtert auf ein einzelnes Objekt', async () => {
    const team = await login(alpen);
    const first = await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');
    await createCustomer(team, alpen.workspaceId, 'Bergwind AG');

    const { data } = await listActivity(
      team,
      alpen.workspaceId,
      `?entityType=customer&entityId=${first.id}`,
    );

    expect(data).toHaveLength(1);
    expect(data[0]?.entityId).toBe(first.id);
  });

  it('weist unbekannte Filterwerte ab, statt sie zu ignorieren', async () => {
    const team = await login(alpen);
    const response = await team.request(
      `/api/v1/workspaces/${alpen.workspaceId}/activity?action=customer.erfunden`,
    );
    expect(response.status).toBe(422);
  });

  it('zeigt einem fremden Workspace nichts und antwortet mit 404', async () => {
    const team = await login(alpen);
    const response = await team.request(`/api/v1/workspaces/${nordlicht.workspaceId}/activity`);
    expect(response.status).toBe(404);
  });

  it('trennt die Protokolle zweier Workspaces vollständig', async () => {
    const alpenTeam = await login(alpen);
    const nordlichtTeam = await login(nordlicht);
    await createCustomer(alpenTeam, alpen.workspaceId, 'Seeblick GmbH');
    await createCustomer(nordlichtTeam, nordlicht.workspaceId, 'Talblick AG');

    const alpenLog = await listActivity(alpenTeam, alpen.workspaceId);
    const names = alpenLog.data.map((event) => event.metadata.name);

    expect(names).toContain('Seeblick GmbH');
    expect(names).not.toContain('Talblick AG');
  });

  it('bleibt für einen Kundenzugang verschlossen', async () => {
    const clientAccount = await seedClientUser(server.db, {
      workspaceId: alpen.workspaceId,
      customerName: 'Seeblick GmbH',
      email: 'kundin@seeblick.example',
    });
    const client = await login(clientAccount);

    const response = await client.request(`/api/v1/workspaces/${alpen.workspaceId}/activity`);
    expect(response.status).toBe(404);
  });

  it('gibt CSV mit Kopfzeile und Anhang-Header aus', async () => {
    const team = await login(alpen);
    await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');

    const response = await team.request(
      `/api/v1/workspaces/${alpen.workspaceId}/activity/export?format=csv`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('x-export-truncated')).toBe('false');

    // Auf Byte-Ebene geprüft: `response.text()` entfernt eine führende BOM
    // selbst, die Datei im Dateisystem hat sie aber, und genau darauf
    // reagiert Excel.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    const body = new TextDecoder().decode(bytes);
    expect(body).toContain('"customer.created"');
    expect(body).toContain('Seeblick GmbH');
  });

  it('gibt JSON mit denselben Einträgen aus', async () => {
    const team = await login(alpen);
    await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');

    const response = await team.request(
      `/api/v1/workspaces/${alpen.workspaceId}/activity/export?format=json`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as { events: ActivityEvent[] };
    expect(body.events.at(-1)?.action).toBe('customer.created');
  });

  it('meldet eine ungebrochene Kette', async () => {
    const team = await login(alpen);
    await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');
    await createCustomer(team, alpen.workspaceId, 'Bergwind AG');

    const response = await team.request(
      `/api/v1/workspaces/${alpen.workspaceId}/activity/integrity`,
    );
    expect(response.status).toBe(200);

    const report = (await response.json()) as ActivityChainReport;
    expect(report.sealed).toBeGreaterThanOrEqual(2);
    expect(report.unsealed).toBe(0);
    expect(report.brokenAt).toBeNull();
  });

  it('erkennt eine Änderung direkt in der Datenbank', async () => {
    const team = await login(alpen);
    const customer = await createCustomer(team, alpen.workspaceId, 'Seeblick GmbH');
    await createCustomer(team, alpen.workspaceId, 'Bergwind AG');

    // Der Weg, den ein Protokoll überhaupt fürchten muss: jemand mit
    // Datenbankzugang schreibt einen Eintrag um.
    await server.db.execute(
      sql`update activity_events set metadata = '{"name":"Andere GmbH"}'::jsonb
          where entity_id = ${customer.id} and action = 'customer.created'`,
    );

    const response = await team.request(
      `/api/v1/workspaces/${alpen.workspaceId}/activity/integrity`,
    );
    const report = (await response.json()) as ActivityChainReport;
    expect(report.brokenAt).not.toBeNull();
  });
});

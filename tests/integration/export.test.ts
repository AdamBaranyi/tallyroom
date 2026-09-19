import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readZip } from '../../apps/api/src/lib/zip.ts';
import { buildScenario, login, type Scenario } from '../helpers/scenario.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';
import { INTERNAL_COMMENT, INTERNAL_NOTE } from '../helpers/scenario.ts';
import { makePdfBytes, seedWorkspaceWithOwner } from '../helpers/fixtures.ts';

let server: TestServer;
let scenario: Scenario;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  scenario = await buildScenario(server);
});

async function download(client: TestClient, path: string): Promise<Map<string, Uint8Array>> {
  const response = await client.request(path);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/zip');
  expect(response.headers.get('content-disposition')).toContain('.zip');
  return readZip(new Uint8Array(await response.arrayBuffer()));
}

function textOf(entries: Map<string, Uint8Array>, name: string): string {
  const entry = entries.get(name);
  expect(entry, `Eintrag ${name} fehlt`).toBeDefined();
  return new TextDecoder().decode(entry);
}

/** Alles zusammen, um in einem Rutsch nach einem verräterischen Wort zu suchen. */
function everything(entries: Map<string, Uint8Array>): string {
  return [...entries.values()].map((bytes) => new TextDecoder().decode(bytes)).join('\n');
}

describe('Datenauszug', () => {
  it('liefert dem Owner den vollständigen Bestand', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );

    expect([...entries.keys()]).toContain('daten.json');
    expect([...entries.keys()]).toContain('LIESMICH.txt');
    expect([...entries.keys()]).toContain('tabellen/kunden.csv');

    const data = JSON.parse(textOf(entries, 'daten.json')) as {
      customers: { name: string }[];
      activity: unknown[];
      members: { email: string }[];
    };
    expect(data.customers.length).toBeGreaterThan(0);
    expect(data.activity.length).toBeGreaterThan(0);
    expect(data.members.length).toBeGreaterThan(0);
  });

  it('enthält im vollständigen Auszug die internen Vermerke — es ist der Auszug des Betreibers', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );

    expect(everything(entries)).toContain(INTERNAL_NOTE);
  });

  it('nimmt keine Passwörter mit', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );

    const alles = everything(entries);
    expect(alles).not.toContain('passwordHash');
    expect(alles).not.toContain('$argon2');
  });

  it('legt die Dokumente als Dateien dazu', async () => {
    // Der Aufbau bringt keine Datei mit; eine hochzuladen ist der Punkt.
    const csrf = await scenario.team.csrfToken();
    const upload = await scenario.team.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/documents?` +
        new URLSearchParams({
          customerId: scenario.ownCustomer.id,
          filename: 'bericht.pdf',
        }).toString(),
      {
        method: 'POST',
        csrf,
        headers: { 'content-type': 'application/pdf' },
        body: makePdfBytes(),
      },
    );
    expect(upload.status).toBe(201);

    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );

    const dateien = [...entries.keys()].filter((name) => name.startsWith('dokumente/'));
    expect(dateien.length).toBeGreaterThan(0);
    for (const name of dateien) {
      if (name.endsWith('FEHLEND.txt')) continue;
      expect(new TextDecoder().decode(entries.get(name)?.slice(0, 4))).toBe('%PDF');
    }
  });

  it('bleibt einem fremden Workspace verschlossen', async () => {
    const fremd = await seedWorkspaceWithOwner(server.db, {
      workspaceName: 'Nordlicht Architektur',
      email: 'owner@nordlicht.test',
    });
    const response = await scenario.team.request(
      `/api/v1/workspaces/${fremd.workspaceId}/export/workspace`,
    );
    expect(response.status).toBe(404);
  });

  it('bleibt einem Kundenzugang verschlossen', async () => {
    const response = await scenario.client.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );
    expect(response.status).toBe(404);
  });

  it('verlangt für den vollständigen Auszug die Rolle Owner', async () => {
    const member = await seedWorkspaceWithOwner(server.db, {
      workspaceName: 'Zweiter Workspace',
      email: 'mitglied@alpenblick.test',
    });
    await server.db.execute(
      `insert into memberships (workspace_id, user_id, role)
       values ('${scenario.agency.workspaceId}', '${member.userId}', 'member')`,
    );
    const mitglied = await login(server, member);

    const response = await mitglied.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/workspace`,
    );
    expect(response.status).toBe(403);
  });
});

describe('Übergabepaket', () => {
  it('enthält nur, was im Portal freigegeben ist', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/customers/${scenario.ownCustomer.id}`,
    );

    const alles = everything(entries);
    expect(alles).toContain(scenario.ownCustomer.name);
    expect(alles).toContain(scenario.visibleProject.name);

    // Die Grenze, um die es geht.
    expect(alles).not.toContain(INTERNAL_NOTE);
    expect(alles).not.toContain(INTERNAL_COMMENT);
    expect(alles).not.toContain(scenario.hiddenProject.name);
  });

  it('nennt im Beipackzettel, was fehlt und warum', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/customers/${scenario.ownCustomer.id}`,
    );

    const liesmich = textOf(entries, 'LIESMICH.txt');
    expect(liesmich).toContain(scenario.ownCustomer.name);
    expect(liesmich).toContain('Nicht enthalten');
  });

  it('zeigt einem fremden Kunden nichts', async () => {
    const entries = await download(
      scenario.team,
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/customers/${scenario.otherCustomer.id}`,
    );

    expect(everything(entries)).not.toContain(scenario.visibleProject.name);
  });

  it('bleibt einem Kundenzugang verschlossen', async () => {
    const response = await scenario.client.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/export/customers/${scenario.ownCustomer.id}`,
    );
    expect(response.status).toBe(404);
  });
});

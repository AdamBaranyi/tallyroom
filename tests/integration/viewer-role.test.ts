import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Customer, ListResponse } from '@tallyroom/contracts';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let agency: SeededWorkspace;
let owner: TestClient;
let viewer: TestClient;
let customer: Customer;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
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

beforeEach(async () => {
  await server.reset();
  agency = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });
  owner = await login(agency);

  const csrf = await owner.csrfToken();
  const created = await owner.request(`/api/v1/workspaces/${agency.workspaceId}/customers`, {
    method: 'POST',
    csrf,
    body: JSON.stringify({ name: 'Seeblick GmbH' }),
  });
  expect(created.status).toBe(201);
  customer = (await created.json()) as Customer;

  // Ein zweites Konto, das im selben Workspace nur mitlesen darf.
  const account = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Zweiter Workspace',
    email: 'buchhaltung@alpenblick.test',
  });
  await server.db.execute(
    sql`insert into memberships (workspace_id, user_id, role)
        values (${agency.workspaceId}, ${account.userId}, 'viewer')`,
  );
  viewer = await login(account);
});

describe('Rolle «Nur lesen»', () => {
  it('sieht dieselbe Liste wie das Team', async () => {
    const response = await viewer.request(`/api/v1/workspaces/${agency.workspaceId}/customers`);
    expect(response.status).toBe(200);

    const list = (await response.json()) as ListResponse<Customer>;
    expect(list.data.map((entry) => entry.name)).toContain('Seeblick GmbH');
  });

  it('sieht auch die internen Notizen — sie ist Teil des Teams', async () => {
    const response = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/customers/${customer.id}`,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty('internalNote');
  });

  it('darf das Protokoll lesen', async () => {
    const response = await viewer.request(`/api/v1/workspaces/${agency.workspaceId}/activity`);
    expect(response.status).toBe(200);
  });

  it('legt keinen Kunden an', async () => {
    const csrf = await viewer.csrfToken();
    const response = await viewer.request(`/api/v1/workspaces/${agency.workspaceId}/customers`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ name: 'Heimlich GmbH' }),
    });
    expect(response.status).toBe(403);
  });

  it('ändert keinen bestehenden Kunden', async () => {
    const csrf = await viewer.csrfToken();
    const response = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/customers/${customer.id}`,
      {
        method: 'PATCH',
        csrf,
        body: JSON.stringify({ name: 'Umbenannt', version: customer.version }),
      },
    );
    expect(response.status).toBe(403);
  });

  it('archiviert nichts', async () => {
    const csrf = await viewer.csrfToken();
    const response = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/customers/${customer.id}/archive`,
      { method: 'POST', csrf },
    );
    expect(response.status).toBe(403);
  });

  it('legt keine Anfrage an und lädt kein Dokument hoch', async () => {
    const csrf = await viewer.csrfToken();

    const request = await viewer.request(`/api/v1/workspaces/${agency.workspaceId}/requests`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ customerId: customer.id, subject: 'Nein', body: 'Nein' }),
    });
    expect(request.status).toBe(403);

    const upload = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/documents?customerId=${customer.id}&filename=x.pdf`,
      { method: 'POST', csrf, headers: { 'content-type': 'application/pdf' }, body: '%PDF-1.7' },
    );
    expect(upload.status).toBe(403);
  });

  it('lädt niemanden ein', async () => {
    const csrf = await viewer.csrfToken();
    const response = await viewer.request(`/api/v1/workspaces/${agency.workspaceId}/invitations`, {
      method: 'POST',
      csrf,
      body: JSON.stringify({ email: 'neu@alpenblick.test', role: 'member', customerId: null }),
    });
    expect(response.status).toBe(403);
  });

  it('bekommt den vollständigen Datenauszug nicht', async () => {
    const response = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/export/workspace`,
    );
    expect(response.status).toBe(403);
  });

  it('kann aber ein Übergabepaket zusammenstellen', async () => {
    const response = await viewer.request(
      `/api/v1/workspaces/${agency.workspaceId}/export/customers/${customer.id}`,
    );
    expect(response.status).toBe(200);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Customer, Dashboard, ListResponse, ServiceRequest } from '@tallyroom/contracts';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { startTestServer, type TestClient, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let agency: SeededWorkspace;
let team: TestClient;
let customer: Customer;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

async function post<T>(path: string, body: Record<string, unknown>, expected = 201): Promise<T> {
  const csrf = await team.csrfToken();
  const response = await team.request(path, { method: 'POST', csrf, body: JSON.stringify(body) });
  if (response.status !== expected) {
    throw new Error(
      `${path}: erwartet ${expected}, erhalten ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

beforeEach(async () => {
  await server.reset();
  agency = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Alpenblick Studio',
    email: 'owner@alpenblick.test',
  });

  team = server.client();
  const csrf = await team.csrfToken();
  const login = await team.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    body: JSON.stringify({ email: agency.email, password: agency.password }),
  });
  expect(login.status).toBe(200);

  customer = await post<Customer>(`/api/v1/workspaces/${agency.workspaceId}/customers`, {
    name: 'Seeblick GmbH',
  });
});

async function createRequest(subject: string): Promise<ServiceRequest> {
  return post<ServiceRequest>(`/api/v1/workspaces/${agency.workspaceId}/requests`, {
    customerId: customer.id,
    subject,
    body: 'Bitte schauen Sie sich das an.',
  });
}

async function setStatus(request: ServiceRequest, status: string): Promise<ServiceRequest> {
  return post<ServiceRequest>(
    `/api/v1/workspaces/${agency.workspaceId}/requests/${request.id}/status`,
    { status, version: request.version },
    200,
  );
}

describe('Wer hält auf', () => {
  it('legt den Ball beim Team, solange die Anfrage offen ist', async () => {
    const request = await createRequest('Logo in neuer Auflösung');

    expect(request.waitingOn).toBe('team');
    expect(new Date(request.waitingSince).getTime()).toBeGreaterThan(0);
  });

  it('gibt den Ball an den Kunden ab und wieder zurück', async () => {
    const request = await createRequest('Rückfrage zum Text');

    const waiting = await setStatus(request, 'waiting_customer');
    expect(waiting.waitingOn).toBe('client');

    const back = await setStatus(waiting, 'in_progress');
    expect(back.waitingOn).toBe('team');
  });

  it('lässt eine erledigte Anfrage auf niemanden warten', async () => {
    const request = await createRequest('Erledigt');
    const resolved = await setStatus(request, 'resolved');

    expect(resolved.waitingOn).toBeNull();
  });

  it('zählt die Wartezeit ab dem Statuswechsel, nicht ab dem Anlegen', async () => {
    const request = await createRequest('Wechsel');
    const waiting = await setStatus(request, 'waiting_customer');

    expect(new Date(waiting.waitingSince).getTime()).toBeGreaterThanOrEqual(
      new Date(request.createdAt).getTime(),
    );
  });

  it('filtert die Liste nach der Seite, bei der der Ball liegt', async () => {
    const erste = await createRequest('Bleibt bei uns');
    const zweite = await createRequest('Geht zum Kunden');
    await setStatus(zweite, 'waiting_customer');

    const response = await team.request(
      `/api/v1/workspaces/${agency.workspaceId}/requests?waitingOn=client`,
    );
    const liste = (await response.json()) as ListResponse<ServiceRequest>;

    expect(liste.data.map((entry) => entry.id)).toEqual([zweite.id]);
    expect(liste.data.map((entry) => entry.id)).not.toContain(erste.id);
  });

  it('zeigt die Aufteilung im Dashboard', async () => {
    const erste = await createRequest('Bei uns');
    await createRequest('Auch bei uns');
    const dritte = await createRequest('Beim Kunden');
    await setStatus(dritte, 'waiting_customer');
    await setStatus(erste, 'resolved');

    const response = await team.request(`/api/v1/workspaces/${agency.workspaceId}/dashboard`);
    const dashboard = (await response.json()) as Dashboard;

    expect(dashboard.requestsWaitingOnTeam).toBe(1);
    expect(dashboard.requestsWaitingOnClient).toBe(1);
    expect(dashboard.longestWaitDays).toBe(0);
  });

  it('meldet ohne offene Anfrage keine Wartezeit', async () => {
    const response = await team.request(`/api/v1/workspaces/${agency.workspaceId}/dashboard`);
    const dashboard = (await response.json()) as Dashboard;

    expect(dashboard.requestsWaitingOnTeam).toBe(0);
    expect(dashboard.requestsWaitingOnClient).toBe(0);
    expect(dashboard.longestWaitDays).toBeNull();
  });
});

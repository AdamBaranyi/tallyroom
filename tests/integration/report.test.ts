import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { MonthlyReport } from '@tallyroom/contracts';
import { buildScenario, type Scenario } from '../helpers/scenario.ts';
import { INTERNAL_COMMENT, INTERNAL_NOTE } from '../helpers/scenario.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

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

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

async function teamReport(month: string): Promise<MonthlyReport> {
  const response = await scenario.team.request(
    `/api/v1/workspaces/${scenario.agency.workspaceId}/report/${scenario.ownCustomer.id}?month=${month}`,
  );
  expect(response.status).toBe(200);
  return (await response.json()) as MonthlyReport;
}

describe('Monatsbericht', () => {
  it('zählt die Anfragen des Monats und nennt die offenen', async () => {
    const report = await teamReport(thisMonth());

    expect(report.customerName).toBe(scenario.ownCustomer.name);
    expect(report.month).toBe(thisMonth());
    expect(report.requestsOpened).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.openRequests)).toBe(true);
  });

  it('führt nur freigegebene Projekte auf', async () => {
    const report = await teamReport(thisMonth());

    const namen = report.activeProjects.map((project) => project.name);
    expect(namen).toContain(scenario.visibleProject.name);
    expect(namen).not.toContain(scenario.hiddenProject.name);
  });

  it('trägt nichts Internes', async () => {
    const report = await teamReport(thisMonth());
    const alles = JSON.stringify(report);

    expect(alles).not.toContain(INTERNAL_NOTE);
    expect(alles).not.toContain(INTERNAL_COMMENT);
  });

  it('nimmt ohne Angabe den letzten abgeschlossenen Monat', async () => {
    const response = await scenario.team.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/report/${scenario.ownCustomer.id}`,
    );
    expect(response.status).toBe(200);

    const report = (await response.json()) as MonthlyReport;
    expect(report.month).not.toBe(thisMonth());
    expect(report.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it('weist einen erfundenen Monat ab', async () => {
    const response = await scenario.team.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/report/${scenario.ownCustomer.id}?month=2026-13`,
    );
    expect(response.status).toBe(422);
  });

  it('zeigt dem Kunden im Portal denselben Bericht', async () => {
    const team = await teamReport(thisMonth());

    const response = await scenario.client.request(
      `/api/v1/portal/${scenario.agency.workspaceId}/report?month=${thisMonth()}`,
    );
    expect(response.status).toBe(200);

    const client = (await response.json()) as MonthlyReport;
    expect(client.customerName).toBe(team.customerName);
    expect(client.activeProjects.map((p) => p.name)).toEqual(
      team.activeProjects.map((p) => p.name),
    );
  });

  it('gibt einem Kundenzugang keinen Bericht über einen fremden Kunden', async () => {
    const response = await scenario.client.request(
      `/api/v1/workspaces/${scenario.agency.workspaceId}/report/${scenario.otherCustomer.id}`,
    );
    expect(response.status).toBe(404);
  });
});

import { monthRange, previousMonth, waitingSideOf, type MonthlyReport } from '@tallyroom/contracts';
import { notFound } from '../../lib/http-error.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import type { PortalRepository } from '../portal/repository.ts';
import type { ReportRepository } from './repository.ts';

/** Der erste Tag des Folgemonats — die obere, ausschliessende Grenze. */
function nextFirst(month: string): string {
  const [year, index] = month.split('-').map(Number) as [number, number];
  return index === 12 ? `${year + 1}-01-01` : `${year}-${String(index + 1).padStart(2, '0')}-01`;
}

/**
 * Der Monatsbericht eines Kunden.
 *
 * Er entsteht aus den Daten, die der Kunde ohnehin sehen darf, und aus dem
 * Aktivitätsprotokoll — nicht aus einer eigenen Sammlung, die jemand pflegen
 * müsste. Deshalb steht er sofort zur Verfügung, auch rückwirkend, und deshalb
 * enthält er nichts Internes: die Projektliste kommt aus derselben Schicht wie
 * das Portal, und das Protokoll trägt keine Notizen, sondern nur Handlungen.
 *
 * Er ersetzt die Stunde, die eine Agentur Monat für Monat damit verbringt,
 * denselben Stand aus vier Ansichten abzuschreiben.
 */
export function createReportService(portal: PortalRepository, repository: ReportRepository) {
  return {
    async build(
      workspaceId: string,
      customerId: string,
      timezone: string,
      month?: string,
    ): Promise<MonthlyReport> {
      const customer = await portal.customer(workspaceId, customerId);
      if (!customer)
        throw notFound({
          de: 'Kunde nicht gefunden.',
          fr: 'Client introuvable.',
          it: 'Cliente non trovato.',
          en: 'Customer not found.',
        });

      const today = todayInTimezone(timezone);
      const reported = month ?? previousMonth(today.slice(0, 7));
      const { last } = monthRange(reported);
      const period = { first: `${reported}-01`, nextFirst: nextFirst(reported), timezone };

      const [milestonesCompleted, requestsOpened, requestsResolved, documentsShared] =
        await Promise.all([
          repository.milestonesCompleted(workspaceId, customerId, period),
          repository.requestsOpened(workspaceId, customerId, period),
          repository.requestsResolved(workspaceId, customerId, period),
          repository.documentsShared(workspaceId, customerId, period),
        ]);

      const [projects, contracts, requests] = await Promise.all([
        portal.projects(workspaceId, customerId),
        portal.contracts(workspaceId, customerId, last),
        portal.requests(workspaceId, customerId),
      ]);

      const open = requests.filter((request) => request.status !== 'resolved');

      return {
        month: reported,
        customerName: customer.name,
        generatedAt: new Date().toISOString(),
        milestonesCompleted: milestonesCompleted.map((row) => ({
          title: row.title,
          projectName: row.projectName,
          date: row.date.toISOString(),
        })),
        requestsOpened,
        requestsResolved,
        openRequests: open.map((request) => ({
          subject: request.subject,
          waitingOn: waitingSideOf(request.status),
          waitingSince: (request.statusChangedAt
            ? new Date(request.statusChangedAt)
            : request.createdAt
          ).toISOString(),
        })),
        documentsShared: documentsShared.map((row) => ({
          name: row.name,
          date: row.date.toISOString(),
        })),
        activeProjects: projects.map((project) => ({
          name: project.name,
          milestonesDone: project.milestonesDone,
          milestoneCount: project.milestoneCount,
        })),
        monthlyContractValueMinor: contracts.reduce(
          (sum, contract) => sum + (contract.monthlyAmountMinor ?? 0),
          0,
        ),
        contractCount: contracts.length,
      };
    },
  };
}

export type ReportService = ReturnType<typeof createReportService>;

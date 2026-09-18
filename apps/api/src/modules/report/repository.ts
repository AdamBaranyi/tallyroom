import { and, asc, count, eq, gte, lt, sql } from 'drizzle-orm';
import {
  activityEvents,
  documents,
  milestones,
  projects,
  serviceRequests,
  type Database,
} from '@tallyroom/db';

/**
 * Die Zahlen des Monatsberichts.
 *
 * Woher sie kommen, ist der Punkt: erledigte Meilensteine und gelöste Anfragen
 * stehen im Aktivitätsprotokoll, weil dort jede Zustandsänderung mit ihrem
 * Zeitpunkt liegt. Ohne das Protokoll gäbe es für «was ist im September
 * passiert» keine Quelle — eine Tabelle kennt nur ihren heutigen Stand.
 */
export function createReportRepository(db: Database) {
  /** Monatsgrenzen in der Zeitzone des Workspace, nicht der des Servers. */
  function range(first: string, lastExclusive: string, timezone: string) {
    return {
      from: sql`(${first}::date)::timestamp at time zone ${timezone}`,
      to: sql`(${lastExclusive}::date)::timestamp at time zone ${timezone}`,
    };
  }

  return {
    async milestonesCompleted(
      workspaceId: string,
      customerId: string,
      period: { first: string; nextFirst: string; timezone: string },
    ) {
      const { from, to } = range(period.first, period.nextFirst, period.timezone);
      return db
        .select({
          title: milestones.title,
          projectName: projects.name,
          date: activityEvents.createdAt,
        })
        .from(activityEvents)
        .innerJoin(
          milestones,
          and(
            eq(milestones.id, activityEvents.entityId),
            eq(milestones.workspaceId, activityEvents.workspaceId),
          ),
        )
        .innerJoin(projects, eq(projects.id, milestones.projectId))
        .where(
          and(
            eq(activityEvents.workspaceId, workspaceId),
            eq(activityEvents.action, 'milestone.completed'),
            eq(projects.customerId, customerId),
            // Was der Kunde nicht sehen darf, steht auch nicht in seinem Bericht.
            eq(projects.clientVisible, true),
            gte(activityEvents.createdAt, from),
            lt(activityEvents.createdAt, to),
          ),
        )
        .orderBy(asc(activityEvents.createdAt));
    },

    async requestsOpened(
      workspaceId: string,
      customerId: string,
      period: { first: string; nextFirst: string; timezone: string },
    ) {
      const { from, to } = range(period.first, period.nextFirst, period.timezone);
      const [row] = await db
        .select({ value: count() })
        .from(serviceRequests)
        .where(
          and(
            eq(serviceRequests.workspaceId, workspaceId),
            eq(serviceRequests.customerId, customerId),
            gte(serviceRequests.createdAt, from),
            lt(serviceRequests.createdAt, to),
          ),
        );
      return row?.value ?? 0;
    },

    async requestsResolved(
      workspaceId: string,
      customerId: string,
      period: { first: string; nextFirst: string; timezone: string },
    ) {
      const { from, to } = range(period.first, period.nextFirst, period.timezone);
      const [row] = await db
        .select({ value: count() })
        .from(activityEvents)
        .innerJoin(
          serviceRequests,
          and(
            eq(serviceRequests.id, activityEvents.entityId),
            eq(serviceRequests.workspaceId, activityEvents.workspaceId),
          ),
        )
        .where(
          and(
            eq(activityEvents.workspaceId, workspaceId),
            eq(activityEvents.action, 'request.status_changed'),
            sql`${activityEvents.metadata} ->> 'to' = 'resolved'`,
            eq(serviceRequests.customerId, customerId),
            gte(activityEvents.createdAt, from),
            lt(activityEvents.createdAt, to),
          ),
        );
      return row?.value ?? 0;
    },

    async documentsShared(
      workspaceId: string,
      customerId: string,
      period: { first: string; nextFirst: string; timezone: string },
    ) {
      const { from, to } = range(period.first, period.nextFirst, period.timezone);
      return db
        .select({ name: documents.originalName, date: documents.createdAt })
        .from(documents)
        .where(
          and(
            eq(documents.workspaceId, workspaceId),
            eq(documents.customerId, customerId),
            eq(documents.clientVisible, true),
            eq(documents.deletionStatus, 'active'),
            gte(documents.createdAt, from),
            lt(documents.createdAt, to),
          ),
        )
        .orderBy(asc(documents.createdAt));
    },
  };
}

export type ReportRepository = ReturnType<typeof createReportRepository>;

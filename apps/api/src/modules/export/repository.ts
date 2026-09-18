import { asc, eq } from 'drizzle-orm';
import {
  activityEvents,
  contractRates,
  customers,
  documents,
  memberships,
  milestones,
  projects,
  requestComments,
  serviceContracts,
  serviceRequests,
  users,
  workspaces,
  type Database,
} from '@tallyroom/db';

/**
 * Der vollständige Bestand eines Workspace, Tabelle für Tabelle.
 *
 * Bewusst eigene Abfragen statt der Listen aus den Fachmodulen: die filtern,
 * seitenweise und nach Sichtbarkeit — ein Auszug, der etwas weglässt, weil
 * eine Liste es gerade nicht zeigt, wäre unbrauchbar.
 */
export function createExportRepository(db: Database) {
  return {
    async workspace(workspaceId: string) {
      const [row] = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          timezone: workspaces.timezone,
          createdAt: workspaces.createdAt,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return row;
    },

    customers: (workspaceId: string) =>
      db
        .select()
        .from(customers)
        .where(eq(customers.workspaceId, workspaceId))
        .orderBy(asc(customers.createdAt)),

    projects: (workspaceId: string) =>
      db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(asc(projects.createdAt)),

    milestones: (workspaceId: string) =>
      db
        .select()
        .from(milestones)
        .where(eq(milestones.workspaceId, workspaceId))
        .orderBy(asc(milestones.createdAt)),

    contracts: (workspaceId: string) =>
      db
        .select()
        .from(serviceContracts)
        .where(eq(serviceContracts.workspaceId, workspaceId))
        .orderBy(asc(serviceContracts.createdAt)),

    rates: (workspaceId: string) =>
      db
        .select()
        .from(contractRates)
        .where(eq(contractRates.workspaceId, workspaceId))
        .orderBy(asc(contractRates.effectiveFrom)),

    requests: (workspaceId: string) =>
      db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.workspaceId, workspaceId))
        .orderBy(asc(serviceRequests.createdAt)),

    comments: (workspaceId: string) =>
      db
        .select()
        .from(requestComments)
        .where(eq(requestComments.workspaceId, workspaceId))
        .orderBy(asc(requestComments.createdAt)),

    documents: (workspaceId: string) =>
      db
        .select()
        .from(documents)
        .where(eq(documents.workspaceId, workspaceId))
        .orderBy(asc(documents.createdAt)),

    /** Wer Zugang hat, mit Rolle — ohne Passwort-Hash, versteht sich. */
    members: (workspaceId: string) =>
      db
        .select({
          userId: users.id,
          displayName: users.displayName,
          email: users.normalizedEmail,
          role: memberships.role,
          customerId: memberships.customerId,
          since: memberships.createdAt,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.workspaceId, workspaceId))
        .orderBy(asc(memberships.createdAt)),

    activity: (workspaceId: string) =>
      db
        .select({
          sequence: activityEvents.sequence,
          createdAt: activityEvents.createdAt,
          actorId: activityEvents.actorId,
          action: activityEvents.action,
          entityType: activityEvents.entityType,
          entityId: activityEvents.entityId,
          metadata: activityEvents.metadata,
          hash: activityEvents.hash,
        })
        .from(activityEvents)
        .where(eq(activityEvents.workspaceId, workspaceId))
        .orderBy(asc(activityEvents.sequence)),
  };
}

export type ExportRepository = ReturnType<typeof createExportRepository>;

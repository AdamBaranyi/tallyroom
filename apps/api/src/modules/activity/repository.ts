import { and, asc, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { activityEvents, users, type Database } from '@tallyroom/db';
import { ACTIVITY_RETENTION_DAYS, type ActivityListQuery } from '@tallyroom/contracts';

/** Die Filter der Liste, ergänzt um die Zeitzone des Workspace. */
export interface ActivityScope extends ActivityListQuery {
  timezone: string;
}

const COLUMNS = {
  id: activityEvents.id,
  sequence: activityEvents.sequence,
  action: activityEvents.action,
  entityType: activityEvents.entityType,
  entityId: activityEvents.entityId,
  metadata: activityEvents.metadata,
  actorId: activityEvents.actorId,
  actorName: users.displayName,
  createdAt: activityEvents.createdAt,
  hash: activityEvents.hash,
};

export function createActivityRepository(db: Database) {
  function scope(workspaceId: string, query: ActivityScope) {
    const filters = [eq(activityEvents.workspaceId, workspaceId)];

    if (query.entityType) filters.push(eq(activityEvents.entityType, query.entityType));
    if (query.entityId) filters.push(eq(activityEvents.entityId, query.entityId));
    if (query.actorId) filters.push(eq(activityEvents.actorId, query.actorId));
    if (query.action) filters.push(eq(activityEvents.action, query.action));

    /*
     * Tagesgrenzen in der Zeitzone des Workspace. Serverzeit wäre falsch:
     * ein Eintrag vom 1. um 00:30 in Zürich liegt in UTC noch im Vormonat.
     * Das Ende ist der Beginn des Folgetags, damit der letzte Tag ganz zählt.
     */
    if (query.from) {
      filters.push(
        gte(
          activityEvents.createdAt,
          sql`(${query.from}::date)::timestamp at time zone ${query.timezone}`,
        ),
      );
    }
    if (query.to) {
      filters.push(
        lt(
          activityEvents.createdAt,
          sql`(${query.to}::date + 1)::timestamp at time zone ${query.timezone}`,
        ),
      );
    }

    return and(...filters);
  }

  function selectEvents(where: ReturnType<typeof scope>) {
    return db
      .select(COLUMNS)
      .from(activityEvents)
      .leftJoin(users, eq(users.id, activityEvents.actorId))
      .where(where);
  }

  return {
    /** Neueste zuerst; die laufende Nummer ist die stabile Reihenfolge. */
    async list(workspaceId: string, query: ActivityScope, page: { offset: number; limit: number }) {
      const where = scope(workspaceId, query);
      const [rows, [total]] = await Promise.all([
        selectEvents(where)
          .orderBy(desc(activityEvents.sequence))
          .limit(page.limit)
          .offset(page.offset),
        db.select({ value: count() }).from(activityEvents).where(where),
      ]);
      return { rows, total: total?.value ?? 0 };
    },

    /** Für die Ausgabe: älteste zuerst, damit die Datei chronologisch liest. */
    async forExport(workspaceId: string, query: ActivityScope, limit: number) {
      return selectEvents(scope(workspaceId, query))
        .orderBy(asc(activityEvents.sequence))
        .limit(limit);
    },

    /** Vollständige Kette eines Workspace, aufsteigend — Grundlage der Prüfung. */
    async chain(workspaceId: string) {
      return db
        .select({
          sequence: activityEvents.sequence,
          workspaceId: activityEvents.workspaceId,
          actorId: activityEvents.actorId,
          action: activityEvents.action,
          entityType: activityEvents.entityType,
          entityId: activityEvents.entityId,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          previousHash: activityEvents.previousHash,
          hash: activityEvents.hash,
        })
        .from(activityEvents)
        .where(eq(activityEvents.workspaceId, workspaceId))
        .orderBy(asc(activityEvents.sequence));
    },

    /** Aufbewahrung: alles, was älter als die Frist ist, fällt weg. */
    async deleteExpired(now: Date = new Date()) {
      const cutoff = new Date(now.getTime() - ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const removed = await db
        .delete(activityEvents)
        .where(lt(activityEvents.createdAt, cutoff))
        .returning({ id: activityEvents.id });
      return removed.length;
    },
  };
}

export type ActivityRepository = ReturnType<typeof createActivityRepository>;

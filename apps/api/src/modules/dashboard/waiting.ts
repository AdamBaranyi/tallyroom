import { and, eq, inArray, sql } from 'drizzle-orm';
import { serviceRequests, type Database } from '@tallyroom/db';
import { OPEN_REQUEST_STATUS } from '@tallyroom/contracts';
import {
  statusChangedAt,
  WAITING_ON_CLIENT_STATUS,
  WAITING_ON_TEAM_STATUS,
} from '../../lib/request-waiting.ts';

export interface WaitingBalance {
  team: number;
  client: number;
  longestDays: number | null;
}

/**
 * Wie viele offene Anfragen bei uns liegen, wie viele beim Kunden, und wie
 * lange der älteste Vorgang schon wartet.
 *
 * Eine einzelne Abfrage statt drei: die Zahlen gehören zusammen, und ein
 * Dashboard, das dreimal dieselbe Tabelle liest, wird mit den Daten langsam.
 * Der Tagesabstand wird in der Datenbank gerechnet, damit Zeitzone und
 * Rundung dieselben sind wie in der Liste.
 */
export async function waitingBalance(db: Database, workspaceId: string): Promise<WaitingBalance> {
  const [row] = await db
    .select({
      team: sql<number>`count(*) filter (
        where ${inArray(serviceRequests.status, [...WAITING_ON_TEAM_STATUS])}
      )::int`,
      client: sql<number>`count(*) filter (
        where ${inArray(serviceRequests.status, [...WAITING_ON_CLIENT_STATUS])}
      )::int`,
      longestDays: sql<number | null>`max(
        floor(
          extract(
            epoch from (now() - coalesce(${statusChangedAt}, ${serviceRequests.createdAt}))
          ) / 86400
        )
      )::int`,
    })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.workspaceId, workspaceId),
        inArray(serviceRequests.status, [...OPEN_REQUEST_STATUS]),
      ),
    );

  return {
    team: row?.team ?? 0,
    client: row?.client ?? 0,
    longestDays: row?.longestDays ?? null,
  };
}

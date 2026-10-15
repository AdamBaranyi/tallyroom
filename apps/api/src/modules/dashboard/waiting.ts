import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { customers, serviceRequests, type Database } from '@tallyroom/db';
import { OPEN_REQUEST_STATUS, waitingSideOf, type OldestOpenRequest } from '@tallyroom/contracts';
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

/** So viele Anfragen nennt das Dashboard unter «Am längsten offen». */
const OLDEST_OPEN_LIMIT = 5;

/**
 * Die offenen Anfragen, die am längsten liegen, älteste zuerst.
 *
 * Dieselbe Grundmenge und derselbe Zeitpunkt wie in `waitingBalance`: offene
 * Status, letzter Statuswechsel, sonst das Anlegen. Darum steht zuoberst
 * genau der Vorgang, dessen Alter darüber als «Ältester Vorgang» steht. Bei
 * gleichem Zeitpunkt entscheidet die ID, nicht der Zufall der Abfrage.
 */
export async function oldestOpenRequests(
  db: Database,
  workspaceId: string,
): Promise<OldestOpenRequest[]> {
  const waitingSince = sql<string>`coalesce(${statusChangedAt}, ${serviceRequests.createdAt})`;
  const rows = await db
    .select({
      id: serviceRequests.id,
      subject: serviceRequests.subject,
      customerName: customers.name,
      status: serviceRequests.status,
      waitingSince,
    })
    .from(serviceRequests)
    .innerJoin(customers, eq(customers.id, serviceRequests.customerId))
    .where(
      and(
        eq(serviceRequests.workspaceId, workspaceId),
        inArray(serviceRequests.status, [...OPEN_REQUEST_STATUS]),
      ),
    )
    .orderBy(asc(waitingSince), asc(serviceRequests.id))
    .limit(OLDEST_OPEN_LIMIT);

  return rows.flatMap((row) => {
    const waitingOn = waitingSideOf(row.status);
    // Ein offener Status hat immer eine Seite; die Prüfung dient dem Typ.
    if (!waitingOn) return [];
    return [
      {
        id: row.id,
        subject: row.subject,
        customerName: row.customerName,
        waitingOn,
        // Rohes SQL liefert eine Zeichenkette, siehe `statusChangedAt`.
        waitingSince: new Date(row.waitingSince).toISOString(),
      },
    ];
  });
}

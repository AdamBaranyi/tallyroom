import { sql } from 'drizzle-orm';
import { activityEvents, serviceRequests } from '@tallyroom/db';

/**
 * Seit wann eine Anfrage dort liegt, wo sie liegt: der Zeitpunkt ihres
 * letzten Statuswechsels.
 *
 * Er steht im Protokoll, das jeden Wechsel ohnehin schreibt. Eine eigene
 * Spalte dafür wäre eine zweite Wahrheit, die beim ersten Fehler auseinander
 * läuft. Fehlt der Eintrag — der Status wechselte nie, oder die
 * Aufbewahrungsfrist hat ihn weggeräumt —, zählt das Anlegen; der Aufrufer
 * setzt dafür `coalesce`.
 *
 * Der Wert kommt als Zeichenkette zurück, nicht als Date: Drizzle wandelt
 * Zeitstempel nur für Spalten um, die es kennt, und ein SQL-Ausdruck ist
 * keine. Wer ihn benutzt, macht selbst ein Date daraus — sonst steht am Ende
 * ein `toISOString is not a function` in der Antwort.
 */
export const statusChangedAt = sql<string | null>`(
  select max(${activityEvents.createdAt})
  from ${activityEvents}
  where ${activityEvents.workspaceId} = ${serviceRequests.workspaceId}
    and ${activityEvents.entityType} = 'request'
    and ${activityEvents.entityId} = ${serviceRequests.id}
    and ${activityEvents.action} = 'request.status_changed'
)`;

/** Die offenen Zustände, aufgeteilt nach der Seite, bei der der Ball liegt. */
export const WAITING_ON_TEAM_STATUS = ['open', 'in_progress'] as const;
export const WAITING_ON_CLIENT_STATUS = ['waiting_customer'] as const;

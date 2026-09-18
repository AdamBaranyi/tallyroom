import { desc, eq, sql } from 'drizzle-orm';
import { activityEvents, type Executor } from '@tallyroom/db';
import { advisoryLockKey, chainHash } from './activity-chain.ts';

/**
 * Erlaubte Metadaten je Aktionstyp. Alles, was hier nicht steht, wird
 * verworfen — damit gelangen weder interne Notizen noch Kommentartexte ins
 * Protokoll, auch nicht versehentlich.
 */
const ALLOWED_KEYS: Record<string, readonly string[]> = {
  'customer.created': ['name'],
  'customer.updated': ['changedFields'],
  'customer.archived': ['name'],
  'customer.restored': ['name'],
  'project.created': ['name', 'customerId'],
  'project.updated': ['changedFields'],
  'project.status_changed': ['from', 'to', 'hasReason'],
  'milestone.created': ['title'],
  'milestone.completed': ['title'],
  'milestone.reopened': ['title'],
  'contract.created': ['name', 'customerId'],
  'contract.updated': ['changedFields'],
  // Bewusst nur das Datum, nie der Betrag — das Protokoll ist kein Preisarchiv.
  'contract.rate_added': ['effectiveFrom'],
  'request.created': ['customerId', 'priority'],
  'request.updated': ['changedFields'],
  'request.status_changed': ['from', 'to'],
  // Nur die Sichtbarkeit, niemals der Kommentartext.
  'request.commented': ['visibility'],
  'document.uploaded': ['originalName', 'customerId'],
  'document.visibility_changed': ['clientVisible'],
  'document.deleted': ['originalName'],
  'invitation.created': ['role'],
  'invitation.accepted': ['role'],
  'membership.created': ['role'],
};

export type ActivityAction = keyof typeof ALLOWED_KEYS;

/** Für den Abgleich mit ACTIVITY_ACTIONS aus den Verträgen. */
export const KNOWN_ACTIONS: readonly string[] = Object.keys(ALLOWED_KEYS);

export function isKnownAction(action: string): boolean {
  return Object.hasOwn(ALLOWED_KEYS, action);
}

/**
 * Filtert auf die erlaubten Schlüssel. Ein unbekannter Aktionstyp erhält keine
 * Metadaten — lieber ein leeres Protokoll als ein undichtes.
 */
export function filterMetadata(
  action: string,
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = ALLOWED_KEYS[action];
  if (!allowed) return {};

  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.hasOwn(metadata, key)) result[key] = metadata[key];
  }
  return result;
}

export interface ActivityInput {
  workspaceId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Wird innerhalb derselben Transaktion wie die Änderung geschrieben, damit
 * Protokoll und Datenstand nicht auseinanderlaufen.
 *
 * Der Eintrag hängt sich an den Hash seines Vorgängers. Die Sperre gilt je
 * Workspace und nur bis zum Ende der Transaktion: ohne sie könnten zwei
 * gleichzeitige Schreiber denselben Vorgänger lesen und die Kette gabeln.
 */
export async function recordActivity(tx: Executor, input: ActivityInput): Promise<void> {
  const metadata = filterMetadata(input.action, input.metadata ?? {});
  const createdAt = new Date();

  await tx.execute(sql`select pg_advisory_xact_lock(${advisoryLockKey(input.workspaceId)})`);

  const [previous] = await tx
    .select({ hash: activityEvents.hash })
    .from(activityEvents)
    .where(eq(activityEvents.workspaceId, input.workspaceId))
    .orderBy(desc(activityEvents.sequence))
    .limit(1);

  const previousHash = previous?.hash ?? null;

  await tx.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata,
    createdAt,
    previousHash,
    hash: chainHash({
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata,
      createdAt,
      previousHash,
    }),
  });
}

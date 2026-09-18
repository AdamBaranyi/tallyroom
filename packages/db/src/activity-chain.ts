import { createHash } from 'node:crypto';

/**
 * Die Hash-Kette des Aktivitätsprotokolls.
 *
 * Jeder Eintrag hasht seinen eigenen Inhalt zusammen mit dem Hash seines
 * Vorgängers im selben Workspace. Wer einen Eintrag nachträglich ändert oder
 * entfernt, müsste alle folgenden Hashes neu rechnen — und der Vergleich
 * fällt auf. Das ersetzt keinen schreibgeschützten Speicher, macht eine
 * Änderung aber nachweisbar, und das ist der Zweck eines Protokolls.
 *
 * Die Berechnung liegt in der Datenschicht, weil sowohl die API beim
 * Schreiben als auch der Vorführ-Seed sie braucht.
 */

export interface ChainFields {
  workspaceId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  previousHash: string | null;
}

/**
 * Schlüssel sortiert, damit zwei gleiche Metadaten immer denselben Hash
 * ergeben — die Reihenfolge in JSON ist sonst Zufall der Einfügung.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonical(entry)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

export function chainHash(fields: ChainFields): string {
  const payload = JSON.stringify([
    fields.previousHash ?? '',
    fields.workspaceId,
    fields.actorId ?? '',
    fields.action,
    fields.entityType,
    fields.entityId ?? '',
    canonical(fields.metadata),
    fields.createdAt.toISOString(),
  ]);
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Sperrschlüssel je Workspace für `pg_advisory_xact_lock`. Ohne ihn könnten
 * zwei gleichzeitige Transaktionen denselben Vorgänger lesen und zwei
 * Einträge an dieselbe Stelle hängen.
 */
export function advisoryLockKey(workspaceId: string): bigint {
  const digest = createHash('sha256').update(workspaceId).digest();
  // Vorzeichenbehaftete 64 Bit, weil PostgreSQL bigint so verlangt.
  return digest.readBigInt64BE(0);
}

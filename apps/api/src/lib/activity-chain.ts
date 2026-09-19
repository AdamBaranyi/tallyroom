import { chainHash, type ChainFields } from '@tallyroom/db';
import type { ActivityChainReport } from '@tallyroom/contracts';

/** Berechnung und Sperrschlüssel liegen in der Datenschicht, siehe dort. */
export { advisoryLockKey, chainHash, type ChainFields } from '@tallyroom/db';

export interface ChainRow extends ChainFields {
  sequence: number;
  hash: string | null;
}

/**
 * Prüft eine nach `sequence` aufsteigend sortierte Folge. Einträge ohne Hash
 * stammen von vor der Einführung der Kette; sie werden gezählt, nicht
 * bemängelt. Gemeldet wird die erste Stelle, an der etwas nicht mehr passt.
 */
export function verifyChain(rows: readonly ChainRow[]): ActivityChainReport {
  let sealed = 0;
  let unsealed = 0;
  let brokenAt: number | null = null;
  let expectedPrevious: string | null = null;

  for (const row of rows) {
    if (row.hash === null) {
      unsealed += 1;
      continue;
    }

    const linked = sealed === 0 || row.previousHash === expectedPrevious;
    const recomputed = chainHash({ ...row, previousHash: row.previousHash });

    if (brokenAt === null && (!linked || recomputed !== row.hash)) brokenAt = row.sequence;

    sealed += 1;
    expectedPrevious = row.hash;
  }

  return { checked: rows.length, sealed, unsealed, brokenAt };
}

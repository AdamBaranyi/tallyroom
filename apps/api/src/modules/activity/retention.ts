import { ACTIVITY_RETENTION_DAYS } from '@tallyroom/contracts';
import type { Logger } from '../../lib/logger.ts';
import type { ActivityRepository } from './repository.ts';

/**
 * Aufbewahrung des Protokolls. Eine Frist, die nur in der
 * Datenschutzerklärung steht und nirgends greift, ist keine Frist — deshalb
 * räumt dieser Lauf ältere Einträge tatsächlich weg.
 *
 * Einmal täglich reicht: die Frist zählt in Monaten, nicht in Minuten. Der
 * erste Lauf kommt beim Start, damit ein lange gestoppter Server nicht bis
 * zum nächsten Tag mit abgelaufenen Einträgen läuft.
 */
const INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function deleteExpiredActivity(
  repository: ActivityRepository,
  logger?: Logger,
): Promise<number> {
  const removed = await repository.deleteExpired();
  if (removed > 0) {
    logger?.info({ removed, retentionDays: ACTIVITY_RETENTION_DAYS }, 'Protokoll aufgeräumt');
  }
  return removed;
}

export function startActivityRetention(repository: ActivityRepository, logger: Logger): () => void {
  const run = () => {
    deleteExpiredActivity(repository, logger).catch((error: unknown) => {
      logger.error({ err: error }, 'Aufräumen des Protokolls fehlgeschlagen');
    });
  };

  run();
  const timer = setInterval(run, INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}

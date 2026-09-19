import type { ActivityChainReport } from '@tallyroom/contracts';
import type { activityMessages } from './messages.ts';

type IntegrityMessages = (typeof activityMessages)['de']['integrity'];

interface IntegrityResultProps {
  report: ActivityChainReport | undefined;
  failed: boolean;
  messages: IntegrityMessages;
}

/**
 * Das Ergebnis der Kettenprüfung. Es steht erst da, wenn geprüft wurde —
 * ein Feld, das dauerhaft „unversehrt" behauptet, ohne dass jemand gerechnet
 * hat, wäre genau die Sorte Aussage, die dieses Projekt nicht macht.
 */
export function IntegrityResult({ report, failed, messages }: IntegrityResultProps) {
  if (!failed && !report) return null;

  const broken = report?.brokenAt ?? null;

  return (
    <div
      role="status"
      className={[
        'flex flex-col gap-1 border px-4 py-3',
        broken === null && !failed ? 'border-line bg-surface' : 'border-danger bg-surface',
      ].join(' ')}
    >
      {failed && <p className="text-body font-medium text-danger">{messages.failed}</p>}

      {report && broken !== null && (
        <p className="text-body font-medium text-danger">{messages.broken(broken)}</p>
      )}

      {report && broken === null && (
        <p className="text-body font-medium text-ink">{messages.intact(report.sealed)}</p>
      )}

      {report && report.unsealed > 0 && (
        <p className="text-body text-muted">{messages.unsealed(report.unsealed)}</p>
      )}

      <p className="text-body text-muted">{messages.explanation}</p>
    </div>
  );
}

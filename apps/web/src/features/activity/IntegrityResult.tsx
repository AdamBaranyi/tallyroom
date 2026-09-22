import type { ActivityChainReport } from '@tallyroom/contracts';
import type { activityMessages } from './messages.ts';

type IntegrityMessages = (typeof activityMessages)['de']['integrity'];

interface IntegrityResultProps {
  report: ActivityChainReport | undefined;
  failed: boolean;
  pending: boolean;
  messages: IntegrityMessages;
}

/**
 * Das Ergebnis der Kettenprüfung. Es steht erst da, wenn geprüft wurde —
 * ein Feld, das dauerhaft „unversehrt" behauptet, ohne dass jemand gerechnet
 * hat, wäre genau die Sorte Aussage, die dieses Projekt nicht macht.
 *
 * Angesagt wird es über eine eigene Statuszeile, die immer im Dokument steht.
 * Stand die Rolle `status` am Kasten selbst, kam sie mit ihrem Inhalt zugleich
 * ins Dokument — und weder VoiceOver noch NVDA sagten das Ergebnis an. Eine
 * Statusmeldung wird nur gehört, wenn ihr Behälter schon da war, bevor sich
 * sein Inhalt ändert (DIAGNOSTICS Nummer 29).
 */
export function IntegrityResult({ report, failed, pending, messages }: IntegrityResultProps) {
  const broken = report?.brokenAt ?? null;
  const shown = !pending && (failed || report !== undefined);

  return (
    <>
      <p role="status" className="sr-only">
        {shown ? announcement(report, failed, messages) : ''}
      </p>

      {shown && (
        <div
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
      )}
    </>
  );
}

/** Der Befund in einem Satz, ohne die Erklärung darunter — die steht sichtbar da. */
function announcement(
  report: ActivityChainReport | undefined,
  failed: boolean,
  messages: IntegrityMessages,
): string {
  if (failed || !report) return messages.failed;
  const verdict =
    report.brokenAt === null ? messages.intact(report.sealed) : messages.broken(report.brokenAt);
  return report.unsealed > 0 ? `${verdict} ${messages.unsealed(report.unsealed)}` : verdict;
}

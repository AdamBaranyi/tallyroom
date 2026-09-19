import { Link } from 'react-router';
import type { Dashboard } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { dashboardMessages } from './messages.ts';

interface Props {
  data: Dashboard;
  /** Pfadwurzel des Workspace, für die Sprünge in die gefilterten Listen. */
  base: string;
}

/**
 * Wer am Zug ist, in einer Zeile.
 *
 * Die Zahl der offenen Anfragen allein sagt wenig: sie ist hoch, wenn wir
 * hinterherkommen, und sie ist genauso hoch, wenn wir seit zwei Wochen auf
 * Antworten warten. Getrennt gezählt beantwortet sie die Frage, die im
 * Montagsgespräch tatsächlich gestellt wird.
 *
 * Bewusst keine fünfte und sechste Zelle im Kennzahlband: dort stehen
 * Bestandszahlen, hier steht eine Arbeitslage.
 */
export function WaitingSplit({ data, base }: Props) {
  const m = useMessages(dashboardMessages).waiting;
  const total = data.requestsWaitingOnTeam + data.requestsWaitingOnClient;

  return (
    <section aria-label={m.label} className="flex flex-col">
      <div aria-hidden className="h-px w-full bg-line" />

      <div className="grid gap-4 pt-3 sm:grid-cols-3">
        <Entry
          label={m.team}
          figure={data.requestsWaitingOnTeam}
          note={m.teamNote}
          to={`${base}/requests?waitingOn=team`}
        />
        <Entry
          label={m.client}
          figure={data.requestsWaitingOnClient}
          note={m.clientNote}
          to={`${base}/requests?waitingOn=client`}
        />

        <div className="flex flex-col">
          <span className="font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase">
            {m.longest}
          </span>
          <span className="mt-2 font-mono text-page leading-none font-medium tabular-nums">
            {data.longestWaitDays === null ? '—' : m.days(data.longestWaitDays)}
          </span>
          <span className="mt-3 text-body leading-snug text-muted">
            {total === 0 ? m.noneOpen : m.longestNote}
          </span>
        </div>
      </div>
    </section>
  );
}

function Entry({
  label,
  figure,
  note,
  to,
}: {
  label: string;
  figure: number;
  note: string;
  to: string;
}) {
  return (
    <Link to={to} className="group flex flex-col text-ink">
      <span className="font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase transition-colors ease-state duration-[var(--dur-snap)] group-hover:text-ink">
        {label}
      </span>
      <span className="mt-2 font-mono text-page leading-none font-medium tabular-nums">
        {figure}
      </span>
      <span className="mt-3 text-body leading-snug text-muted">{note}</span>
    </Link>
  );
}

import { formatAmountMinor, type MonthlyReport } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { WaitingLine } from '../requests/WaitingLine.tsx';
import { reportMessages } from './messages.ts';

function formatMonth(month: string, locale: string): string {
  const [year, index] = month.split('-').map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, index - 1, 1)),
  );
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Der Bericht selbst, ohne Rahmen und ohne Bedienung: dieselbe Ansicht steht
 * in der Teamansicht und im Kundenportal. Zwei Fassungen desselben Berichts
 * wären zwei Gelegenheiten, verschiedene Zahlen zu zeigen.
 *
 * Aus Sicht des Kunden gesprochen — im Portal wie im Team. Wer den Bericht
 * ausdruckt, gibt ihn weiter; er darf nicht klingen, als lese jemand mit.
 */
export function ReportView({
  report,
  perspective = 'team',
}: {
  report: MonthlyReport;
  perspective?: 'team' | 'client';
}) {
  const m = useMessages(reportMessages);
  const locale = 'de-CH';

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-page leading-tight font-semibold tracking-[-0.02em]">{m.title}</h1>
        <p className="text-body">
          {m.lead(report.customerName, formatMonth(report.month, locale))}
        </p>
        <p className="text-body text-muted">{m.generated(formatDay(report.generatedAt))}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Figure
          label={m.sections.requests}
          value={`${report.requestsOpened} / ${report.requestsResolved}`}
          note={`${m.counts.opened} / ${m.counts.resolved}`}
        />
        <Figure
          label={m.sections.done}
          value={String(report.milestonesCompleted.length)}
          note={m.counts.milestonesDone}
        />
        <Figure
          label={m.sections.contracts}
          value={formatAmountMinor(report.monthlyContractValueMinor)}
          note={m.counts.contracts(report.contractCount)}
        />
      </div>

      <Card>
        <CardHeader title={m.sections.done} />
        <div className="px-4 pb-5 sm:px-5">
          {report.milestonesCompleted.length === 0 ? (
            <p className="text-body text-muted">{m.empty.done}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.milestonesCompleted.map((entry) => (
                <li key={`${entry.date}-${entry.title}`} className="flex flex-col">
                  <span className="text-body font-medium">{entry.title}</span>
                  <span className="text-body text-muted">
                    {entry.projectName} · {formatDay(entry.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={m.sections.open} />
        <div className="px-4 pb-5 sm:px-5">
          {report.openRequests.length === 0 ? (
            <p className="text-body text-muted">{m.empty.open}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.openRequests.map((request) => (
                <li key={request.subject} className="flex flex-col">
                  <span className="text-body font-medium">{request.subject}</span>
                  <WaitingLine
                    waitingOn={request.waitingOn}
                    waitingSince={request.waitingSince}
                    perspective={perspective}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={m.sections.projects} />
        <div className="px-4 pb-5 sm:px-5">
          {report.activeProjects.length === 0 ? (
            <p className="text-body text-muted">{m.empty.projects}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.activeProjects.map((project) => (
                <li key={project.name} className="flex flex-wrap justify-between gap-2">
                  <span className="text-body font-medium">{project.name}</span>
                  <span className="text-body text-muted">
                    {m.counts.milestones(project.milestonesDone, project.milestoneCount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={m.sections.documents} />
        <div className="px-4 pb-5 sm:px-5">
          {report.documentsShared.length === 0 ? (
            <p className="text-body text-muted">{m.empty.documents}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.documentsShared.map((document) => (
                <li key={`${document.date}-${document.name}`} className="flex flex-col">
                  <span className="text-body font-medium break-words">{document.name}</span>
                  <span className="text-body text-muted">{formatDay(document.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <p className="text-body text-muted">{m.source}</p>
    </article>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex flex-col border-t border-line pt-3">
      <span className="font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase">
        {label}
      </span>
      <span className="mt-2 font-mono text-page leading-none font-medium tabular-nums">
        {value}
      </span>
      <span className="mt-2 text-body text-muted">{note}</span>
    </div>
  );
}

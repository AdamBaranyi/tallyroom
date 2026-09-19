import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { workspacePath } from '../../lib/paths.ts';
import { useCustomerReport } from './api.ts';
import { MonthPicker } from './MonthPicker.tsx';
import { reportMessages } from './messages.ts';
import { ReportView } from './ReportView.tsx';

/**
 * Der Bericht in der Teamansicht. Er wird nicht erzeugt und abgelegt, sondern
 * bei jedem Aufruf aus dem Bestand gerechnet — deshalb gibt es auch für einen
 * Monat von vor einem halben Jahr einen, ohne dass jemand ihn damals erstellt
 * hat. Derselbe Bericht steht dem Kunden im Portal zur Verfügung.
 */
export function ReportPage({ workspace }: { workspace: WorkspaceSummary }) {
  const { customerId } = useParams();
  const [params, setParams] = useSearchParams();
  const m = useMessages(reportMessages);

  const month = params.get('month') ?? undefined;
  const query = useCustomerReport(workspace.id, customerId, month);

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={workspacePath(workspace.id, 'customers', customerId ?? '')}
          className="inline-flex items-center gap-1.5 text-body text-muted no-underline hover:text-ink"
        >
          <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          {query.data?.customerName ?? ''}
        </Link>

        <div className="flex flex-wrap items-end gap-3">
          <MonthPicker
            value={query.data?.month ?? month ?? ''}
            onChange={(next) => {
              const nextParams = new URLSearchParams(params);
              nextParams.set('month', next);
              setParams(nextParams, { replace: true });
            }}
          />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.8} aria-hidden="true" />
            {m.print}
          </Button>
        </div>
      </div>

      {query.isPending && <LoadingState label={m.loading} />}
      {query.isError && <ErrorState detail={m.loadFailed} />}
      {query.data && <ReportView report={query.data} />}
    </div>
  );
}

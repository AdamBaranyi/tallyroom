import { Printer } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { usePortalReport } from './api.ts';
import { MonthPicker } from './MonthPicker.tsx';
import { reportMessages } from './messages.ts';
import { ReportView } from './ReportView.tsx';

/**
 * Derselbe Bericht im Portal. Er muss nicht freigegeben werden: er enthält
 * ausschliesslich, was der Kunde ohnehin sehen darf, und wird bei jedem
 * Aufruf gerechnet. Damit entfällt der Schritt, an dem ein Bericht sonst
 * liegen bleibt — das Verschicken.
 */
export function PortalReportPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const m = useMessages(reportMessages);

  const month = params.get('month') ?? undefined;
  const query = usePortalReport(workspace.id, month);

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-end gap-3 print:hidden">
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

      {query.isPending && <LoadingState label={m.loading} />}
      {query.isError && <ErrorState detail={m.loadFailed} />}
      {query.data && <ReportView report={query.data} perspective="client" />}
    </div>
  );
}

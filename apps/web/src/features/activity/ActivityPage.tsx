import { Download, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router';
import {
  ACTIVITY_ENTITY_TYPES,
  type ActivityEntityType,
  type WorkspaceSummary,
} from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { DateField, SelectField } from '../../components/base/Controls.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { ActivityFeed } from './ActivityFeed.tsx';
import { exportUrl, useActivity, useIntegrityCheck, type ActivityParams } from './api.ts';
import { activityMessages } from './messages.ts';
import { IntegrityResult } from './IntegrityResult.tsx';

/** Auswahl und Zeitraum stehen in der URL, damit ein Link teilbar bleibt. */
export function ActivityPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const m = useMessages(activityMessages);

  const entityType = (params.get('entityType') as ActivityEntityType | null) ?? undefined;
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const page = Number(params.get('page') ?? '1');

  const filter: ActivityParams = { entityType, from, to, page };
  const query = useActivity(workspace.id, filter);
  const integrity = useIntegrityCheck(workspace.id);

  function patchParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  const filtered = Boolean(entityType ?? from ?? to);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-section font-semibold tracking-[-0.02em]">{m.title}</h1>
          <p className="mt-1 text-body text-muted">{m.lead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => integrity.mutate()}
            disabled={integrity.isPending}
          >
            <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" />
            {integrity.isPending ? m.integrity.checking : m.integrity.check}
          </Button>
          <a
            href={exportUrl(workspace.id, filter, 'csv')}
            className="text-body inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-4 font-medium text-ink hover:border-ink"
          >
            <Download size={16} strokeWidth={1.8} aria-hidden="true" />
            {m.exportCsv}
          </a>
          <a
            href={exportUrl(workspace.id, filter, 'json')}
            className="text-body inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-4 font-medium text-ink hover:border-ink"
          >
            {m.exportJson}
          </a>
        </div>
      </div>

      <IntegrityResult
        report={integrity.data}
        failed={integrity.isError}
        pending={integrity.isPending}
        messages={m.integrity}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SelectField
          id="activity-entity-type"
          label={m.filters.entityType}
          value={entityType ?? ''}
          onChange={(event) => patchParams({ entityType: event.target.value })}
        >
          <option value="">{m.filters.all}</option>
          {ACTIVITY_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {m.entityType[type]}
            </option>
          ))}
        </SelectField>

        <DateField
          id="activity-from"
          label={m.filters.from}
          value={from ?? ''}
          onChange={(value) => patchParams({ from: value })}
        />

        <DateField
          id="activity-to"
          label={m.filters.to}
          value={to ?? ''}
          onChange={(value) => patchParams({ to: value })}
        />

        {filtered && (
          <Button
            variant="ghost"
            onClick={() => patchParams({ entityType: null, from: null, to: null })}
          >
            {m.filters.reset}
          </Button>
        )}
      </div>

      <Card className="px-4 py-2 sm:px-5">
        {query.isPending && <LoadingState label={m.loading} />}
        {query.isError && <ErrorState detail={m.loadFailed} />}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={filtered ? m.noMatch : m.empty}
            detail={filtered ? m.noMatchDetail : m.emptyDetail}
          />
        )}

        {query.data && query.data.data.length > 0 && (
          <>
            <ActivityFeed events={query.data.data} />
            <Pagination
              pagination={query.data.pagination}
              onChange={(next) => patchParams({ page: String(next) })}
            />
          </>
        )}
      </Card>
    </div>
  );
}

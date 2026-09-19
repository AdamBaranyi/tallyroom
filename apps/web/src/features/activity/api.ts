import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ActivityChainReport,
  ActivityEvent,
  ActivityExportFormat,
  ActivityListQuery,
  ListResponse,
} from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

export interface ActivityParams extends Partial<ActivityListQuery> {
  page?: number;
  pageSize?: number;
}

export function toSearchParams(params: ActivityParams): string {
  const search = new URLSearchParams();
  if (params.entityType) search.set('entityType', params.entityType);
  if (params.entityId) search.set('entityId', params.entityId);
  if (params.actorId) search.set('actorId', params.actorId);
  if (params.action) search.set('action', params.action);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  return query ? `?${query}` : '';
}

const key = (workspaceId: string) => ['activity', workspaceId] as const;

export function useActivity(workspaceId: string, params: ActivityParams) {
  return useQuery({
    queryKey: [...key(workspaceId), params],
    queryFn: () =>
      apiRequest<ListResponse<ActivityEvent>>(
        `/workspaces/${workspaceId}/activity${toSearchParams(params)}`,
      ),
  });
}

/**
 * Die Prüfung läuft über alle Einträge des Workspace und wird deshalb
 * ausdrücklich ausgelöst, nicht bei jedem Seitenaufruf.
 */
export function useIntegrityCheck(workspaceId: string) {
  return useMutation({
    mutationFn: () =>
      apiRequest<ActivityChainReport>(`/workspaces/${workspaceId}/activity/integrity`),
  });
}

/**
 * Die Datei kommt über einen gewöhnlichen Download, nicht über fetch: der
 * Browser kennt den Dateinamen aus dem Header und speichert selbst.
 */
export function exportUrl(
  workspaceId: string,
  params: ActivityParams,
  format: ActivityExportFormat,
): string {
  const query = toSearchParams(params);
  const separator = query ? '&' : '?';
  return `/api/v1/workspaces/${workspaceId}/activity/export${query}${separator}format=${format}`;
}

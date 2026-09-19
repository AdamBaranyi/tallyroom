import { useQuery } from '@tanstack/react-query';
import type { MonthlyReport } from '@tallyroom/contracts';
import { apiRequest } from '../../lib/api.ts';

function suffix(month: string | undefined): string {
  return month ? `?month=${month}` : '';
}

/** Der Bericht aus der Teamansicht, für einen Kunden. */
export function useCustomerReport(
  workspaceId: string,
  customerId: string | undefined,
  month: string | undefined,
) {
  return useQuery({
    queryKey: ['report', workspaceId, customerId, month],
    enabled: Boolean(customerId),
    queryFn: () =>
      apiRequest<MonthlyReport>(
        `/workspaces/${workspaceId}/report/${customerId as string}${suffix(month)}`,
      ),
  });
}

/** Derselbe Bericht aus dem Portal: der Kunde braucht keine Kunden-ID. */
export function usePortalReport(workspaceId: string, month: string | undefined) {
  return useQuery({
    queryKey: ['portal-report', workspaceId, month],
    queryFn: () => apiRequest<MonthlyReport>(`/portal/${workspaceId}/report${suffix(month)}`),
  });
}

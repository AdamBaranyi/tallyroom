import type { ActivityEntityType } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { ActivityFeed } from './ActivityFeed.tsx';
import { useActivity } from './api.ts';
import { activityMessages } from './messages.ts';

interface RecordActivityProps {
  workspaceId: string;
  entityType: ActivityEntityType;
  entityId: string;
  /** Wie viele Einträge am Datensatz stehen. Der Rest steht im Protokoll. */
  limit?: number;
}

/**
 * Der Verlauf eines einzelnen Datensatzes, unter seinen Angaben. Die Frage
 * „wer hat das geändert" stellt sich am Datensatz, nicht auf einer
 * Protokollseite — dort landet, wer den ganzen Workspace durchsehen will.
 */
export function RecordActivity({
  workspaceId,
  entityType,
  entityId,
  limit = 8,
}: RecordActivityProps) {
  const m = useMessages(activityMessages);
  const query = useActivity(workspaceId, { entityType, entityId, pageSize: limit });

  if (query.data && query.data.data.length === 0) return null;

  return (
    <Card>
      <CardHeader title={m.recordTitle} />
      <div className="px-4 pb-2 sm:px-5">
        {query.isPending && <LoadingState label={m.loading} />}
        {query.isError && <ErrorState detail={m.loadFailed} />}
        {query.data && <ActivityFeed events={query.data.data} />}
      </div>
    </Card>
  );
}

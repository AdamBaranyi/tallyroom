import { Download } from 'lucide-react';
import type { WorkspaceSummary } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { exportMessages } from './messages.ts';

/** Ein gewöhnlicher Download: der Browser kennt den Dateinamen aus dem Header. */
export const DOWNLOAD_CLASS =
  'text-body inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-4 font-medium text-ink no-underline hover:border-ink';

/**
 * Der vollständige Auszug. Er steht in den Einstellungen und nicht in einem
 * Menü: wer seine Daten mitnehmen will, sucht dort — und findet den Weg auch
 * dann, wenn er gerade kündigen möchte.
 */
export function DataExportCard({ workspace }: { workspace: WorkspaceSummary }) {
  const m = useMessages(exportMessages);
  const isOwner = workspace.role === 'owner';

  return (
    <Card>
      <CardHeader title={m.title} />
      <div className="flex flex-col gap-3 px-4 pb-5 sm:px-5">
        <p className="text-body text-muted">{m.lead}</p>
        <p className="text-body text-muted">{m.contents}</p>

        {isOwner ? (
          <a
            href={`/api/v1/workspaces/${workspace.id}/export/workspace`}
            className={`${DOWNLOAD_CLASS} self-start`}
          >
            <Download size={16} strokeWidth={1.8} aria-hidden="true" />
            {m.download}
          </a>
        ) : (
          <p className="text-body text-muted">{m.ownerOnly}</p>
        )}
      </div>
    </Card>
  );
}

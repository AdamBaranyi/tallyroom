import { Download } from 'lucide-react';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { DOWNLOAD_CLASS } from './DataExportCard.tsx';
import { exportMessages } from './messages.ts';

/**
 * Das Übergabepaket steht beim Kunden, nicht in den Einstellungen: es gehört
 * zu ihm, und der Moment, in dem man es braucht — Wechsel, Abschluss,
 * Nachfrage —, beginnt auf seiner Seite.
 */
export function HandoverCard({
  workspaceId,
  customerId,
}: {
  workspaceId: string;
  customerId: string;
}) {
  const m = useMessages(exportMessages).handover;

  return (
    <Card>
      <CardHeader title={m.title} />
      <div className="flex flex-col gap-3 px-4 pb-5 sm:px-5">
        <p className="text-body text-muted">{m.lead}</p>
        <p className="text-body text-muted">{m.note}</p>
        <a
          href={`/api/v1/workspaces/${workspaceId}/export/customers/${customerId}`}
          className={`${DOWNLOAD_CLASS} self-start`}
        >
          <Download size={16} strokeWidth={1.8} aria-hidden="true" />
          {m.download}
        </a>
      </div>
    </Card>
  );
}

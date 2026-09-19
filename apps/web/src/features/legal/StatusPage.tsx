import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/base/Button.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { LegalPage, LegalSection } from './LegalPage.tsx';
import { statusMessages } from './status-messages.ts';

/** Bisher keine. Ein Eintrag entsteht von Hand, mit dem Commit, der ihn erklärt. */
const INCIDENTS: readonly { date: string; title: string; resolved: string }[] = [];

interface HealthResult {
  healthy: boolean;
  checkedAt: Date;
}

/**
 * Fragt den Bereitschaftsendpunkt der API. Keine Wiederholung und kein
 * Zwischenspeicher: wer auf diese Seite geht, will wissen, wie es jetzt
 * aussieht, nicht wie es vor fünf Minuten aussah.
 */
async function checkHealth(): Promise<HealthResult> {
  try {
    const response = await fetch('/api/v1/health/ready', { credentials: 'omit' });
    return { healthy: response.ok, checkedAt: new Date() };
  } catch {
    return { healthy: false, checkedAt: new Date() };
  }
}

export function StatusPage() {
  const m = useMessages(statusMessages);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });

  const time = health.data
    ? new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(
        health.data.checkedAt,
      )
    : '';

  return (
    <LegalPage title={m.title} path="/status">
      <p className="text-body">{m.intro}</p>

      <div
        role="status"
        className={[
          'flex flex-col gap-2 border px-4 py-4',
          health.data && !health.data.healthy ? 'border-danger' : 'border-line',
        ].join(' ')}
      >
        <p className="text-body font-medium">
          {health.isPending ? m.checking : health.data?.healthy ? m.up : m.down}
        </p>
        {health.data && <p className="text-body text-muted">{m.checkedAt(time)}</p>}
        <Button
          variant="secondary"
          className="self-start"
          disabled={health.isFetching}
          onClick={() => void health.refetch()}
        >
          {m.recheck}
        </Button>
      </div>

      <LegalSection title={m.watched.title}>
        <List items={m.watched.items} />
      </LegalSection>

      <LegalSection title={m.notWatched.title}>
        <List items={m.notWatched.items} />
      </LegalSection>

      <LegalSection title={m.incidents.title}>
        {INCIDENTS.length === 0 ? (
          <p>{m.incidents.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {INCIDENTS.map((incident) => (
              <li key={incident.date} className="flex flex-col">
                <span className="font-mono tabular-nums text-muted">{incident.date}</span>
                <span className="font-medium">{incident.title}</span>
                <span className="text-muted">{incident.resolved}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted">{m.incidents.note}</p>
      </LegalSection>
    </LegalPage>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

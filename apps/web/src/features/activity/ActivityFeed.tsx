import type { ActivityEvent } from '@tallyroom/contracts';
import { ShieldCheck } from 'lucide-react';
import { domainMessages } from '../../i18n/domain-messages.ts';
import { useMessages } from '../../i18n/messages.ts';
import { actionMessages } from './action-messages.ts';
import { activityMessages } from './messages.ts';

/** Zeitpunkt in Schweizer Schreibweise, in der Zeitzone des Geräts. */
function formatMoment(iso: string): string {
  const moment = new Date(iso);
  const date = new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(moment);
  const time = new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(moment);
  return `${date} ${time}`;
}

type Details = ReturnType<typeof useMessages<(typeof activityMessages)['de']>>['details'];
type Domain = ReturnType<typeof useMessages<(typeof domainMessages)['de']>>;

/**
 * Die Angaben hinter der Handlung. Sie kommen aus der Whitelist des Servers,
 * sind also immer harmlos — Namen, Felder, Zustände, nie ein Text aus einem
 * Kommentar oder einer internen Notiz.
 */
function detailText(event: ActivityEvent, details: Details, domain: Domain): string | null {
  const metadata = event.metadata;
  const parts: string[] = [];

  if (typeof metadata.name === 'string') parts.push(metadata.name);
  if (typeof metadata.title === 'string') parts.push(metadata.title);
  if (typeof metadata.originalName === 'string') parts.push(metadata.originalName);

  if (Array.isArray(metadata.changedFields) && metadata.changedFields.length > 0) {
    parts.push(details.changedFields(metadata.changedFields.join(', ')));
  }

  if (typeof metadata.from === 'string' && typeof metadata.to === 'string') {
    const labels = event.entityType === 'request' ? domain.requestStatus : domain.projectStatus;
    const from = labels[metadata.from as keyof typeof labels] ?? metadata.from;
    const to = labels[metadata.to as keyof typeof labels] ?? metadata.to;
    parts.push(details.fromTo(from, to));
  }

  if (metadata.hasReason === true) parts.push(details.withReason);

  // Nur die hohe Priorität ist eine Aussage; „normal" wäre Rauschen.
  if (metadata.priority === 'high') parts.push(domain.requestPriority.high);

  if (typeof metadata.clientVisible === 'boolean') {
    parts.push(metadata.clientVisible ? details.visible : details.internal);
  }

  if (metadata.visibility === 'public') parts.push(details.publicComment);
  if (metadata.visibility === 'internal') parts.push(details.internalComment);

  if (typeof metadata.role === 'string') {
    parts.push(domain.role[metadata.role as keyof typeof domain.role] ?? metadata.role);
  }

  if (typeof metadata.effectiveFrom === 'string') parts.push(metadata.effectiveFrom);

  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Der Verlauf als Liste, nicht als Tabelle: drei der vier Spalten wären
 * schmal und die vierte lang. So liest er sich ab 320 Pixeln ohne Karten-
 * und Tabellenfassung.
 */
export function ActivityFeed({ events }: { events: readonly ActivityEvent[] }) {
  const m = useMessages(activityMessages);
  const actions = useMessages(actionMessages);
  const domain = useMessages(domainMessages);

  return (
    <ol className="flex flex-col">
      {events.map((event) => {
        const detail = detailText(event, m.details, domain);
        return (
          <li
            key={event.id}
            className="flex flex-col gap-1 border-t border-line-soft py-3 sm:flex-row sm:gap-4"
          >
            <span className="text-body shrink-0 font-mono tabular-nums text-muted sm:w-[9.5rem]">
              {formatMoment(event.createdAt)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body font-medium text-ink">
                {actions[event.action as keyof typeof actions] ?? event.action}
                {event.sealed && (
                  <ShieldCheck
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="ml-1.5 inline-block align-[-2px] text-muted"
                  />
                )}
              </span>
              <span className="text-body text-muted">
                {event.actorName ?? m.unknownActor}
                {detail ? ` · ${detail}` : ''}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

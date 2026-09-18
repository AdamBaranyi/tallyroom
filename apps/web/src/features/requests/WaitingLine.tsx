import { waitingDays, type WaitingSide } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { waitingMessages } from './waiting-messages.ts';

interface WaitingLineProps {
  waitingOn: WaitingSide | null;
  waitingSince: string;
  /** Aus wessen Sicht gesprochen wird: Teamansicht oder Kundenportal. */
  perspective?: 'team' | 'client';
}

/**
 * Wer am Zug ist, und seit wann.
 *
 * Der Status sagt bereits «wartet auf Kunde»; was fehlt, ist die Dauer — und
 * die ist der eigentliche Befund. Eine Anfrage, die seit elf Tagen beim
 * Kunden liegt, ist etwas anderes als eine von gestern, und ohne diese Zeile
 * sieht man beiden dasselbe an.
 *
 * Erledigte Anfragen warten auf niemanden und bekommen deshalb keine Zeile.
 */
export function WaitingLine({ waitingOn, waitingSince, perspective = 'team' }: WaitingLineProps) {
  const m = useMessages(waitingMessages);

  if (!waitingOn) return null;

  const days = waitingDays(waitingSince);
  const side = m[perspective][waitingOn];
  // Bei uns ist es eine Feststellung, beim Gegenüber eine Wartezeit: erst ab
  // einer Woche bekommt sie Gewicht, vorher wäre jede Farbe Alarm ohne Anlass.
  const urgent = days >= 7;

  return (
    <span
      className={['text-body whitespace-nowrap', urgent ? 'text-warning' : 'text-muted'].join(' ')}
    >
      {side} {m.since(days)}
    </span>
  );
}

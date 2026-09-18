import { CONTROL_BASE, CONTROL_LABEL } from '../../components/base/control-style.ts';
import { useMessages } from '../../i18n/messages.ts';
import { reportMessages } from './messages.ts';

/**
 * Monatswahl über `type="month"`. Der Browser bringt seinen eigenen Wähler
 * mit und kennt die Schreibweise des Systems; eine eigene Liste von Monaten
 * müsste beides nachbauen und wäre in vier Sprachen zu pflegen.
 */
export function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const m = useMessages(reportMessages);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="bericht-monat" className={CONTROL_LABEL}>
        {m.month}
      </label>
      <input
        id="bericht-monat"
        name="bericht-monat"
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 ${CONTROL_BASE}`}
      />
    </div>
  );
}

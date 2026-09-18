import type { ReactNode } from 'react';

/**
 * Tabellenteile im Datenblatt-Schnitt.
 *
 * Vier Listen schrieben bisher dieselben Klassen ab. Hier stehen sie einmal,
 * damit eine Spalte in allen vier Listen gleich aussieht — und damit eine
 * Änderung am Raster nicht viermal von Hand nachgezogen werden muss.
 *
 * Keine Hülle, kein Schatten, keine Rundung: die Tabelle ist das Raster. Die
 * Zeile meldet sich beim Überfahren dadurch, dass ihre gedämpften Zellen auf
 * Tinte gehen — die Zeile, auf die man schaut, wird lesbarer. Ein farbiger
 * Streifen an der Kante wäre auch in Tinte wieder der übliche Reflex.
 */

const uebergang = 'transition-colors ease-state duration-[var(--dur-snap)]';

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="hidden w-full border-collapse lg:table">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line text-left">{children}</tr>
    </thead>
  );
}

const KOPF_KLASSEN =
  'font-condensed text-body font-semibold tracking-[0.06em] text-muted uppercase';

interface ThProps {
  children: ReactNode;
  right?: boolean;
  /** Macht die Spalte sortierbar. Ohne diese Angaben bleibt sie ein Titel. */
  sort?:
    | {
        /** Wie diese Spalte in der Abfrage heisst. */
        field: string;
        /** Das gerade sortierte Feld und seine Richtung. */
        active: string;
        direction: 'asc' | 'desc';
        onSort: (field: string) => void;
      }
    | undefined;
}

/**
 * Sortierbare Spalten tragen einen Knopf, keinen Klickbereich am `th`:
 * so erreicht die Tastatur sie, und Screenreader lesen `aria-sort` mit.
 * Das Zeichen dahinter ist ein Dreieck aus Tinte, kein Symbol in Datenfarbe.
 */
export function Th({ children, right = false, sort }: ThProps) {
  const aktiv = sort ? sort.active === sort.field : false;
  const ariaSort = aktiv ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined;

  return (
    <th
      scope="col"
      aria-sort={sort ? (ariaSort ?? 'none') : undefined}
      className={[KOPF_KLASSEN, 'px-3 pb-2', right ? 'text-right' : 'text-left'].join(' ')}
    >
      {sort ? (
        <button
          type="button"
          onClick={() => sort.onSort(sort.field)}
          className={[
            // 24 Pixel hoch: das Mindestmass aus WCAG 2.2 für Zeigeziele.
            // Die 44 der übrigen Bedienelemente würden den Tabellenkopf
            // aufblähen, und er ist Teil des Rasters, nicht der Bedienung.
            'inline-flex min-h-6 items-center gap-1.5 transition-colors ease-state duration-[var(--dur-snap)]',
            aktiv ? 'text-ink' : 'hover:text-ink',
          ].join(' ')}
        >
          {children}
          <span aria-hidden="true" className={aktiv ? 'opacity-100' : 'opacity-0'}>
            {sort.direction === 'asc' ? '▲' : '▼'}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="group border-t border-line-soft">{children}</tr>;
}

interface CellProps {
  children: ReactNode;
  right?: boolean;
  /** Zahlen laufen in Mono und tabellarisch, sonst wandern die Spalten. */
  numeric?: boolean;
  /** Die Spalte, die die Zeile benennt. Trägt Tinte, auch ohne Überfahren. */
  lead?: boolean;
}

export function Cell({ children, right = false, numeric = false, lead = false }: CellProps) {
  return (
    <td
      className={[
        'text-body px-3 py-3',
        right ? 'text-right' : 'text-left',
        numeric ? 'font-mono tabular-nums' : '',
        lead ? 'font-medium text-ink' : `text-muted ${uebergang} group-hover:text-ink`,
      ].join(' ')}
    >
      {children}
    </td>
  );
}

/**
 * Die Kartenliste unter 1024 Pixeln. Dieselben Daten, andere Form — eine
 * Tabelle seitlich zu schieben ist keine Lösung, Spalten wegzulassen auch nicht.
 *
 * Bis zum 12.09.2026 lag die Grenze bei 640 Pixeln. Seit keine Schrift mehr
 * unter 16 px geht, will die schmalste Tabelle (Verträge) 725 Pixel: bei 768
 * stehen 718 zur Verfügung, bei 1024 sind es 742. Also Karten, solange die
 * Seitenleiste nicht steht — gequetschte Spalten brechen sonst mitten im Wort.
 */
export function CardList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col lg:hidden">{children}</ul>;
}

export function CardItem({ children }: { children: ReactNode }) {
  return <li className="border-t border-line-soft">{children}</li>;
}

/**
 * CSV für Tabellenprogramme, nicht für Maschinen — wer das Protokoll
 * herunterlädt, öffnet es in Excel oder Numbers.
 *
 * Deshalb Semikolon als Trennzeichen (deutsche Excel-Voreinstellung), CRLF
 * als Zeilenende und eine BOM voran, sonst zeigt Excel Umlaute falsch.
 * Wer die Daten weiterverarbeitet, nimmt die JSON-Ausgabe.
 */

/**
 * Zeichen, mit denen Tabellenprogramme eine Formel beginnen. Ein Kundenname
 * wie `=1+1` würde sonst beim Öffnen ausgewertet. Ein vorangestelltes
 * Hochkomma macht daraus wieder Text.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const guarded = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"', '""')}"`;
}

export function toCsv(
  header: readonly string[],
  rows: readonly (readonly unknown[])[],
  { withBom = true }: { withBom?: boolean } = {},
): string {
  const lines = [header.map(csvCell).join(';'), ...rows.map((row) => row.map(csvCell).join(';'))];
  return `${withBom ? '﻿' : ''}${lines.join('\r\n')}\r\n`;
}

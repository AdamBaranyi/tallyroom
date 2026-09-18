export type SortDirection = 'asc' | 'desc';

/**
 * Was ein Klick auf einen Spaltenkopf bedeutet: dieselbe Spalte dreht die
 * Richtung, eine andere beginnt aufsteigend.
 *
 * Steht hier und nicht viermal in den Listen — vier Kopien wären vier
 * Gelegenheiten, sich anders zu verhalten.
 */
export function toggleSort(
  activeField: string,
  direction: SortDirection,
  field: string,
): { sort: string; direction: SortDirection } {
  if (field !== activeField) return { sort: field, direction: 'asc' };
  return { sort: field, direction: direction === 'asc' ? 'desc' : 'asc' };
}

/**
 * Die Sortierung aus der URL, gegen die erlaubten Felder der Liste geprüft.
 *
 * Die Prüfung gehört hierher und nicht nur auf den Server: ein erfundenes
 * `?sort=` würde sonst eine 422 auslösen und die Liste leer zurücklassen,
 * statt einfach auf die Vorgabe zu fallen.
 */
export function readSort<T extends string>(
  params: URLSearchParams,
  allowed: readonly T[],
  defaults: { field: T; direction: SortDirection },
): { field: T; direction: SortDirection } {
  const raw = params.get('sort');
  const field = allowed.find((entry) => entry === raw) ?? defaults.field;
  const direction = params.get('direction');
  return {
    field,
    direction: direction === 'asc' || direction === 'desc' ? direction : defaults.direction,
  };
}

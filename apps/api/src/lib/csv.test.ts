import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv.ts';

describe('CSV-Ausgabe des Protokolls', () => {
  it('setzt jede Zelle in Anführungszeichen und verdoppelt enthaltene', () => {
    expect(csvCell('Alpenblick "Studio"')).toBe('"Alpenblick ""Studio"""');
  });

  it('behält Semikolon und Zeilenumbruch innerhalb einer Zelle', () => {
    expect(csvCell('eins;zwei\ndrei')).toBe('"eins;zwei\ndrei"');
  });

  it('entschärft Werte, die ein Tabellenprogramm als Formel liest', () => {
    expect(csvCell('=1+1')).toBe(`"'=1+1"`);
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
    expect(csvCell('-5')).toBe(`"'-5"`);
  });

  it('lässt gewöhnliche Zahlen unangetastet', () => {
    expect(csvCell(42)).toBe('"42"');
  });

  it('schreibt leere Zellen für null und undefined', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it('beginnt mit der BOM und trennt Zeilen mit CRLF', () => {
    const csv = toCsv(['a', 'b'], [[1, 2]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿"a";"b"\r\n"1";"2"\r\n');
  });
});

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { crc32, createZip, readZip } from './zip.ts';

const text = (value: string) => new TextEncoder().encode(value);

/**
 * Die Prüfung, auf die es ankommt: ein fremdes Werkzeug muss das Archiv
 * öffnen können. Ein selbst geschriebener Leser würde nur beweisen, dass der
 * Schreiber zu sich selbst passt.
 */
function unzipAvailable(): boolean {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('ZIP-Schreiber', () => {
  it('berechnet CRC-32 wie die Norm', () => {
    // Bekannter Wert aus der Norm für die Zeichenkette "123456789".
    expect(crc32(text('123456789'))).toBe(0xcbf43926);
  });

  it('legt Einträge in der angegebenen Reihenfolge ab', () => {
    const archive = createZip([
      { name: 'eins.txt', content: text('eins') },
      { name: 'ordner/zwei.txt', content: text('zwei') },
    ]);

    const asText = new TextDecoder('latin1').decode(archive);
    expect(asText.indexOf('eins.txt')).toBeLessThan(asText.indexOf('ordner/zwei.txt'));
    expect(archive.length).toBeGreaterThan(0);
  });

  it('liest die eigenen Einträge wieder ein, komprimiert wie unkomprimiert', () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const archive = createZip([
      { name: 'text.txt', content: text('Ein längerer Text, den Deflate gerne nimmt.') },
      { name: 'datei.pdf', content: pdf, compress: false },
    ]);

    const entries = readZip(archive);
    expect(new TextDecoder().decode(entries.get('text.txt'))).toBe(
      'Ein längerer Text, den Deflate gerne nimmt.',
    );
    expect([...(entries.get('datei.pdf') ?? [])]).toEqual([...pdf]);
  });

  it.skipIf(!unzipAvailable())('schreibt ein Archiv, das unzip prüft und liest', () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const archive = createZip([
      { name: 'daten.json', content: text(JSON.stringify({ kunden: 2 })) },
      { name: 'dokumente/vertrag.pdf', content: pdf, compress: false },
      { name: 'LIESMICH.txt', content: text('Auszug aus Tallyroom.\nZeile zwei.\n') },
    ]);

    const directory = mkdtempSync(join(tmpdir(), 'tallyroom-zip-'));
    const file = join(directory, 'auszug.zip');
    writeFileSync(file, archive);

    // -t prüft jede Prüfsumme, -p gibt eine Datei unverändert aus.
    const check = execFileSync('unzip', ['-t', file], { encoding: 'utf8' });
    expect(check).toContain('No errors detected');

    const content = execFileSync('unzip', ['-p', file, 'daten.json'], { encoding: 'utf8' });
    expect(JSON.parse(content)).toEqual({ kunden: 2 });

    const listing = execFileSync('unzip', ['-l', file], { encoding: 'utf8' });
    expect(listing).toContain('dokumente/vertrag.pdf');
  });
});

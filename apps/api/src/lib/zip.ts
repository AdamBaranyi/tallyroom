import { deflateRawSync, inflateRawSync } from 'node:zlib';

/**
 * Ein kleiner ZIP-Schreiber.
 *
 * ZIP, weil der Auszug für Menschen ist: Doppelklick auf jedem Betriebssystem,
 * ohne Werkzeug und ohne Erklärung. Selbst geschrieben, weil das Format für
 * diesen Zweck aus drei Blöcken besteht und eine Abhängigkeit für 120 Zeilen
 * mehr Angriffsfläche wäre als Nutzen — das Projekt hält seine Abhängigkeiten
 * bewusst kurz.
 *
 * Grenzen, bewusst: kein ZIP64, also bis 4 GB je Datei und Archiv, und alles
 * entsteht im Arbeitsspeicher. Für einen Datenauszug eines Workspace reicht
 * das; wächst er darüber hinaus, gehört er als Strom auf die Platte.
 */

export interface ZipEntry {
  /** Pfad im Archiv, mit Schrägstrichen. */
  name: string;
  content: Uint8Array;
  /**
   * Text wird komprimiert, bereits komprimierte Dateien wie PDF nicht: dort
   * kostet Deflate Rechenzeit und bringt nichts.
   */
  compress?: boolean;
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS-Zeitstempel, wie das Format ihn verlangt. */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: day };
}

interface PreparedEntry {
  nameBytes: Uint8Array;
  data: Uint8Array;
  method: number;
  crc: number;
  originalSize: number;
  offset: number;
}

export function createZip(entries: readonly ZipEntry[], now: Date = new Date()): Uint8Array {
  const stamp = dosDateTime(now);
  const parts: Uint8Array[] = [];
  const prepared: PreparedEntry[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const compress = entry.compress ?? true;
    const data = compress ? new Uint8Array(deflateRawSync(entry.content)) : entry.content;
    const record: PreparedEntry = {
      nameBytes,
      data,
      method: compress ? 8 : 0,
      crc: crc32(entry.content),
      originalSize: entry.content.length,
      offset,
    };
    prepared.push(record);

    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true); // benötigte Version
    header.setUint16(6, 0x0800, true); // Dateinamen in UTF-8
    header.setUint16(8, record.method, true);
    header.setUint16(10, stamp.time, true);
    header.setUint16(12, stamp.date, true);
    header.setUint32(14, record.crc, true);
    header.setUint32(18, record.data.length, true);
    header.setUint32(22, record.originalSize, true);
    header.setUint16(26, nameBytes.length, true);
    header.setUint16(28, 0, true);

    parts.push(new Uint8Array(header.buffer), nameBytes, record.data);
    offset += 30 + nameBytes.length + record.data.length;
  }

  const directoryStart = offset;

  for (const record of prepared) {
    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(4, 20, true); // erzeugende Version
    header.setUint16(6, 20, true);
    header.setUint16(8, 0x0800, true);
    header.setUint16(10, record.method, true);
    header.setUint16(12, stamp.time, true);
    header.setUint16(14, stamp.date, true);
    header.setUint32(16, record.crc, true);
    header.setUint32(20, record.data.length, true);
    header.setUint32(24, record.originalSize, true);
    header.setUint16(28, record.nameBytes.length, true);
    header.setUint16(40, 0o644 << 16, true); // Rechte für Unix-Werkzeuge
    header.setUint32(42, record.offset, true);

    parts.push(new Uint8Array(header.buffer), record.nameBytes);
    offset += 46 + record.nameBytes.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, prepared.length, true);
  end.setUint16(10, prepared.length, true);
  end.setUint32(12, offset - directoryStart, true);
  end.setUint32(16, directoryStart, true);
  parts.push(new Uint8Array(end.buffer));

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const archive = new Uint8Array(total);
  let position = 0;
  for (const part of parts) {
    archive.set(part, position);
    position += part.length;
  }
  return archive;
}

/**
 * Liest ein Archiv wieder ein, das `createZip` geschrieben hat.
 *
 * Gedacht für Prüfungen: ein Test, der beweisen soll, dass eine interne Notiz
 * nicht im Übergabepaket steht, muss in die Einträge hineinsehen können — im
 * komprimierten Strom würde er sie auch dann nicht finden, wenn sie drin wäre.
 */
export function readZip(archive: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const entries = new Map<string, Uint8Array>();
  let position = 0;

  while (position + 30 <= archive.length && view.getUint32(position, true) === 0x04034b50) {
    const method = view.getUint16(position + 8, true);
    const compressedSize = view.getUint32(position + 18, true);
    const nameLength = view.getUint16(position + 26, true);
    const extraLength = view.getUint16(position + 28, true);
    const nameStart = position + 30;
    const dataStart = nameStart + nameLength + extraLength;

    const name = new TextDecoder().decode(archive.subarray(nameStart, nameStart + nameLength));
    const data = archive.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, method === 8 ? new Uint8Array(inflateRawSync(data)) : new Uint8Array(data));

    position = dataStart + compressedSize;
  }

  return entries;
}

import { inCurrentLocale } from '@tallyroom/contracts';
import { toCsv } from '../../lib/csv.ts';
import { notFound } from '../../lib/http-error.ts';
import { createZip, type ZipEntry } from '../../lib/zip.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { ExportRepository } from './repository.ts';
import { readmeText } from './readme.ts';

export interface ExportFile {
  filename: string;
  bytes: Uint8Array;
}

const encoder = new TextEncoder();

function jsonEntry(name: string, value: unknown): ZipEntry {
  return { name, content: encoder.encode(JSON.stringify(value, null, 2)) };
}

/**
 * Eine Tabelle als CSV. Die Kopfzeile trägt die technischen Feldnamen, nicht
 * übersetzte Titel: so passt sie zu `daten.json`, und niemand muss raten,
 * welche Spalte welches Feld war.
 */
function tableEntry(name: string, rows: readonly Record<string, unknown>[]): ZipEntry | null {
  const first = rows[0];
  if (!first) return null;
  const header = Object.keys(first);
  const body = rows.map((row) => header.map((column) => stringify(row[column])));
  return { name, content: encoder.encode(toCsv(header, body)) };
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Dateiname im Archiv: eindeutig, ohne Pfadtrenner, ohne Überraschungen. */
function documentName(id: string, originalName: string): string {
  const safe = originalName.replaceAll(/[^\p{L}\p{N}.\-_ ]/gu, '_').slice(-80);
  return `dokumente/${id.slice(0, 8)}-${safe}`;
}

export function createExportService(repository: ExportRepository, storage: DocumentStorage) {
  return {
    /**
     * Der vollständige Auszug eines Workspace: alles, was in der Datenbank
     * steht, dazu die Dateien selbst. Offene Formate, ohne Werkzeug lesbar —
     * das ist der Unterschied zwischen «Ihre Daten gehören Ihnen» und einer
     * Zusicherung, die niemand einlösen kann.
     */
    async workspace(workspaceId: string): Promise<ExportFile> {
      const workspace = await repository.workspace(workspaceId);
      if (!workspace)
        throw notFound({
          de: 'Workspace nicht gefunden.',
          fr: 'Espace de travail introuvable.',
          it: 'Area di lavoro non trovata.',
          en: 'Workspace not found.',
        });

      const [
        customers,
        projects,
        milestones,
        contracts,
        rates,
        requests,
        comments,
        documents,
        members,
        activity,
      ] = await Promise.all([
        repository.customers(workspaceId),
        repository.projects(workspaceId),
        repository.milestones(workspaceId),
        repository.contracts(workspaceId),
        repository.rates(workspaceId),
        repository.requests(workspaceId),
        repository.comments(workspaceId),
        repository.documents(workspaceId),
        repository.members(workspaceId),
        repository.activity(workspaceId),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        workspace,
        customers,
        projects,
        milestones,
        contracts,
        rates,
        requests,
        comments,
        documents,
        members,
        activity,
      };

      const entries: ZipEntry[] = [
        { name: 'LIESMICH.txt', content: encoder.encode(readmeText('workspace', workspace.name)) },
        jsonEntry('daten.json', data),
      ];

      const tables: [string, readonly Record<string, unknown>[]][] = [
        ['tabellen/kunden.csv', customers],
        ['tabellen/projekte.csv', projects],
        ['tabellen/meilensteine.csv', milestones],
        ['tabellen/vertraege.csv', contracts],
        ['tabellen/preisversionen.csv', rates],
        ['tabellen/anfragen.csv', requests],
        ['tabellen/kommentare.csv', comments],
        ['tabellen/dokumente.csv', documents],
        ['tabellen/mitglieder.csv', members],
        ['tabellen/protokoll.csv', activity],
      ];
      for (const [name, rows] of tables) {
        const entry = tableEntry(name, rows);
        if (entry) entries.push(entry);
      }

      await addFiles(
        entries,
        storage,
        documents.filter((row) => row.deletionStatus === 'active'),
      );

      return {
        filename: `tallyroom-auszug-${new Date().toISOString().slice(0, 10)}.zip`,
        bytes: createZip(entries),
      };
    },
  };
}

/**
 * Fehlt eine Datei im Speicher, bricht der Auszug nicht ab: er vermerkt die
 * Lücke. Ein Archiv, das wegen einer verlorenen Datei gar nicht entsteht,
 * hilft niemandem — und die Lücke gehört benannt, nicht verschwiegen.
 */
async function addFiles(
  entries: ZipEntry[],
  storage: DocumentStorage,
  rows: readonly { id: string; objectKey: string; originalName: string }[],
): Promise<void> {
  const missing: string[] = [];

  for (const row of rows) {
    const object = await storage.get(row.objectKey);
    if (!object) {
      missing.push(`${row.id} ${row.originalName}`);
      continue;
    }
    entries.push({
      name: documentName(row.id, row.originalName),
      content: object.bytes,
      compress: false,
    });
  }

  if (missing.length > 0) {
    entries.push({
      name: 'dokumente/FEHLEND.txt',
      content: encoder.encode(
        `${inCurrentLocale({
          de: 'Diese Dokumente stehen in der Datenbank, ihre Datei fehlt im Speicher:',
          fr: 'Ces documents figurent dans la base, mais leur fichier manque :',
          it: 'Questi documenti sono nella banca dati, ma il file manca:',
          en: 'These documents are in the database, but their file is missing:',
        })}\n\n${missing.join('\n')}\n`,
      ),
    });
  }
}

export type ExportService = ReturnType<typeof createExportService>;

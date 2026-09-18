import { toCsv } from '../../lib/csv.ts';
import { notFound } from '../../lib/http-error.ts';
import { todayInTimezone } from '../../lib/workspace-date.ts';
import { createZip, type ZipEntry } from '../../lib/zip.ts';
import type { DocumentStorage } from '../../storage/types.ts';
import type { PortalRepository } from '../portal/repository.ts';
import { readmeText } from './readme.ts';
import type { ExportFile } from './service.ts';

const encoder = new TextEncoder();

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function tableEntry(name: string, rows: readonly Record<string, unknown>[]): ZipEntry | null {
  const first = rows[0];
  if (!first) return null;
  const header = Object.keys(first);
  return {
    name,
    content: encoder.encode(
      toCsv(
        header,
        rows.map((row) => header.map((column) => stringify(row[column]))),
      ),
    ),
  };
}

/**
 * Das Übergabepaket für einen Kunden.
 *
 * Es entsteht aus der Datenschicht des Kundenportals, nicht aus eigenen
 * Abfragen. Damit gilt hier dieselbe Grenze wie dort — interne Notizen und
 * interne Kommentare kommen gar nicht erst in Reichweite —, und sie ist mit
 * denselben Tests abgedeckt. Eine zweite Abfrage mit denselben Bedingungen
 * wäre eine zweite Stelle, an der sie vergessen werden kann.
 */
export function createHandoverService(portal: PortalRepository, storage: DocumentStorage) {
  return {
    async build(workspaceId: string, customerId: string, timezone: string): Promise<ExportFile> {
      const customer = await portal.customer(workspaceId, customerId);
      if (!customer)
        throw notFound({
          de: 'Kunde nicht gefunden.',
          fr: 'Client introuvable.',
          it: 'Cliente non trovato.',
          en: 'Customer not found.',
        });

      const today = todayInTimezone(timezone);
      const [projects, contracts, requests, documents] = await Promise.all([
        portal.projects(workspaceId, customerId),
        portal.contracts(workspaceId, customerId, today),
        portal.requests(workspaceId, customerId),
        portal.documents(workspaceId, customerId),
      ]);

      const comments = await Promise.all(
        requests.map(async (request) => ({
          requestId: request.id,
          comments: await portal.publicComments(workspaceId, request.id),
        })),
      );

      const data = {
        exportedAt: new Date().toISOString(),
        customer,
        projects,
        contracts,
        requests,
        comments,
        documents: documents.map(({ objectKey: _objectKey, ...rest }) => rest),
      };

      const entries: ZipEntry[] = [
        { name: 'LIESMICH.txt', content: encoder.encode(readmeText('handover', customer.name)) },
        { name: 'daten.json', content: encoder.encode(JSON.stringify(data, null, 2)) },
      ];

      const tables: [string, readonly Record<string, unknown>[]][] = [
        ['tabellen/projekte.csv', projects],
        ['tabellen/vertraege.csv', contracts],
        ['tabellen/anfragen.csv', requests],
        ['tabellen/kommentare.csv', comments.flatMap((entry) => entry.comments)],
        ['tabellen/dokumente.csv', data.documents],
      ];
      for (const [name, rows] of tables) {
        const entry = tableEntry(name, rows);
        if (entry) entries.push(entry);
      }

      for (const document of documents) {
        const object = await storage.get(document.objectKey);
        if (!object) continue;
        const safe = document.originalName.replaceAll(/[^\p{L}\p{N}.\-_ ]/gu, '_').slice(-80);
        entries.push({
          name: `dokumente/${document.id.slice(0, 8)}-${safe}`,
          content: object.bytes,
          compress: false,
        });
      }

      const slug = customer.name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      return {
        filename: `tallyroom-uebergabe-${slug}-${new Date().toISOString().slice(0, 10)}.zip`,
        bytes: createZip(entries),
      };
    },
  };
}

export type HandoverService = ReturnType<typeof createHandoverService>;

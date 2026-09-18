import {
  ACTIVITY_EXPORT_MAX_ROWS,
  inCurrentLocale,
  type ActivityChainReport,
  type ActivityEvent,
  type ActivityExportFormat,
  type ListResponse,
  type PaginationQuery,
} from '@tallyroom/contracts';
import { verifyChain, type ChainRow } from '../../lib/activity-chain.ts';
import { toCsv } from './csv.ts';
import type { ActivityRepository, ActivityScope } from './repository.ts';

interface Row {
  id: string;
  sequence: number;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  actorId: string | null;
  actorName: string | null;
  createdAt: Date;
  hash: string | null;
}

function toDto(row: Row): ActivityEvent {
  return {
    id: row.id,
    sequence: row.sequence,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    actorId: row.actorId,
    actorName: row.actorName,
    createdAt: row.createdAt.toISOString(),
    sealed: row.hash !== null,
  };
}

/** Kopfzeile der Ausgabe in der Sprache des Requests. */
function exportHeader(): string[] {
  return [
    inCurrentLocale({ de: 'Nummer', fr: 'Numéro', it: 'Numero', en: 'Number' }),
    inCurrentLocale({ de: 'Zeitpunkt', fr: 'Horodatage', it: 'Data e ora', en: 'Timestamp' }),
    inCurrentLocale({ de: 'Person', fr: 'Personne', it: 'Persona', en: 'Person' }),
    inCurrentLocale({ de: 'Handlung', fr: 'Action', it: 'Azione', en: 'Action' }),
    inCurrentLocale({ de: 'Objekt', fr: 'Objet', it: 'Oggetto', en: 'Object' }),
    inCurrentLocale({ de: 'Objekt-ID', fr: 'ID objet', it: 'ID oggetto', en: 'Object ID' }),
    inCurrentLocale({ de: 'Angaben', fr: 'Détails', it: 'Dettagli', en: 'Details' }),
    inCurrentLocale({ de: 'Versiegelt', fr: 'Scellé', it: 'Sigillato', en: 'Sealed' }),
  ];
}

function yesNo(value: boolean): string {
  return value
    ? inCurrentLocale({ de: 'ja', fr: 'oui', it: 'sì', en: 'yes' })
    : inCurrentLocale({ de: 'nein', fr: 'non', it: 'no', en: 'no' });
}

export interface ActivityExport {
  body: string;
  contentType: string;
  filename: string;
  /** Wahr, wenn die Obergrenze gegriffen hat und die Datei gekürzt ist. */
  truncated: boolean;
}

export function createActivityService(repository: ActivityRepository) {
  return {
    async list(
      workspaceId: string,
      query: ActivityScope,
      page: PaginationQuery,
    ): Promise<ListResponse<ActivityEvent>> {
      const offset = (page.page - 1) * page.pageSize;
      const { rows, total } = await repository.list(workspaceId, query, {
        offset,
        limit: page.pageSize,
      });

      return {
        data: rows.map(toDto),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
        },
      };
    },

    /**
     * Die Ausgabe ist gedeckelt. Eine Grenze, die man sieht, ist ehrlicher
     * als eine Datei, die der Server irgendwann abbricht; der Hinweis steht
     * im Antwort-Header und in der Oberfläche.
     */
    async export(
      workspaceId: string,
      query: ActivityScope,
      format: ActivityExportFormat,
    ): Promise<ActivityExport> {
      const rows = await repository.forExport(workspaceId, query, ACTIVITY_EXPORT_MAX_ROWS + 1);
      const truncated = rows.length > ACTIVITY_EXPORT_MAX_ROWS;
      const events = rows.slice(0, ACTIVITY_EXPORT_MAX_ROWS).map(toDto);
      const day = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        return {
          body: JSON.stringify({ exportedAt: new Date().toISOString(), events }, null, 2),
          contentType: 'application/json; charset=utf-8',
          filename: `tallyroom-activity-${day}.json`,
          truncated,
        };
      }

      const body = toCsv(
        exportHeader(),
        events.map((event) => [
          event.sequence,
          event.createdAt,
          event.actorName ?? '',
          event.action,
          event.entityType,
          event.entityId ?? '',
          JSON.stringify(event.metadata),
          yesNo(event.sealed),
        ]),
      );

      return {
        body,
        contentType: 'text/csv; charset=utf-8',
        filename: `tallyroom-activity-${day}.csv`,
        truncated,
      };
    },

    /** Prüft die Hash-Kette eines Workspace vollständig. */
    async verify(workspaceId: string): Promise<ActivityChainReport> {
      const rows = await repository.chain(workspaceId);
      return verifyChain(
        rows.map((row): ChainRow => ({
          sequence: row.sequence,
          workspaceId: row.workspaceId,
          actorId: row.actorId,
          action: row.action,
          entityType: row.entityType,
          entityId: row.entityId,
          metadata: (row.metadata ?? {}) as Record<string, unknown>,
          createdAt: row.createdAt,
          previousHash: row.previousHash,
          hash: row.hash,
        })),
      );
    },
  };
}

export type ActivityService = ReturnType<typeof createActivityService>;

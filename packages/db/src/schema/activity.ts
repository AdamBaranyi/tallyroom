import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.ts';
import { workspaces } from './workspaces.ts';

/**
 * Aktivitätsprotokoll. Welche Schlüssel je Aktionstyp in metadata landen
 * dürfen, entscheidet eine Whitelist in der Service-Schicht; sie verhindert,
 * dass interne Notizen oder Kommentarinhalte ins Protokoll gelangen.
 *
 * `hash` und `previousHash` bilden je Workspace eine Kette: jeder Eintrag
 * hasht seinen Inhalt zusammen mit dem Hash seines Vorgängers. Eine
 * nachträgliche Änderung oder ein entfernter Eintrag bricht die Kette und ist
 * damit erkennbar — `bun run verify:activity` prüft das. Einträge von vor der
 * Einführung tragen keinen Hash; die Prüfung zählt sie getrennt, statt sie als
 * Fehler zu melden.
 */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Reihenfolge der Kette. Zeitstempel allein reichen nicht: zwei Einträge
     *  derselben Transaktion können dieselbe Millisekunde tragen. */
    sequence: bigserial('sequence', { mode: 'number' }).notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    previousHash: text('previous_hash'),
    hash: text('hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_workspace_created_idx').on(table.workspaceId, table.createdAt),
    index('activity_entity_idx').on(table.workspaceId, table.entityType, table.entityId),
    index('activity_workspace_sequence_idx').on(table.workspaceId, table.sequence),
  ],
);

/**
 * Verhindert, dass ein Doppelklick zwei Anfragen erzeugt. Gleicher Schlüssel
 * mit geändertem Inhalt ist ein Konflikt, kein zweiter Versuch.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    operation: text('operation').notNull(),
    key: text('key').notNull(),
    /** Hash des Anfrageinhalts, um denselben Schlüssel mit anderem Inhalt zu erkennen. */
    requestHash: text('request_hash').notNull(),
    resultReference: uuid('result_reference'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('idempotency_scope_unique').on(
      table.workspaceId,
      table.userId,
      table.operation,
      table.key,
    ),
    index('idempotency_expiry_idx').on(table.expiresAt),
  ],
);

export type ActivityEventRow = typeof activityEvents.$inferSelect;
export type NewActivityEventRow = typeof activityEvents.$inferInsert;

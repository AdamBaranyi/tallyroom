import { z } from 'zod';

/** Objekte, zu denen es einen Verlauf gibt. */
export const ACTIVITY_ENTITY_TYPES = [
  'customer',
  'project',
  'milestone',
  'contract',
  'request',
  'document',
  'invitation',
  'membership',
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

/**
 * Jede Handlung, die im Protokoll landet. Die API hält ihre
 * Metadaten-Whitelist genau gegen diese Liste; ein Eintrag hier ohne Whitelist
 * dort lässt den Test fehlschlagen, nicht erst die Anzeige.
 */
export const ACTIVITY_ACTIONS = [
  'customer.created',
  'customer.updated',
  'customer.archived',
  'customer.restored',
  'project.created',
  'project.updated',
  'project.status_changed',
  'milestone.created',
  'milestone.completed',
  'milestone.reopened',
  'contract.created',
  'contract.updated',
  'contract.rate_added',
  'request.created',
  'request.updated',
  'request.status_changed',
  'request.commented',
  'document.uploaded',
  'document.visibility_changed',
  'document.deleted',
  'invitation.created',
  'invitation.accepted',
  'membership.created',
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const activityListQuerySchema = z.object({
  entityType: z.enum(ACTIVITY_ENTITY_TYPES).optional(),
  entityId: z.uuid().optional(),
  actorId: z.uuid().optional(),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
  /** Tagesgenau, in der Zeitzone des Workspace ausgewertet. */
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;

export const activityEventSchema = z.object({
  id: z.uuid(),
  sequence: z.number().int(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  actorId: z.uuid().nullable(),
  actorName: z.string().nullable(),
  createdAt: z.string(),
  /**
   * Hängt in der Hash-Kette. Einträge, die vor der Einführung der Kette
   * entstanden sind, tragen keinen Hash und sind hier false.
   */
  sealed: z.boolean(),
});

export type ActivityEvent = z.infer<typeof activityEventSchema>;

export const ACTIVITY_EXPORT_FORMATS = ['csv', 'json'] as const;
export type ActivityExportFormat = (typeof ACTIVITY_EXPORT_FORMATS)[number];

export const activityExportQuerySchema = activityListQuerySchema.extend({
  format: z.enum(ACTIVITY_EXPORT_FORMATS).default('csv'),
});

export type ActivityExportQuery = z.infer<typeof activityExportQuerySchema>;

/**
 * Aufbewahrung des Protokolls: zwölf Monate. Das ist die Frist, die
 * Prüfstellen üblicherweise erwarten, und sie steht so in der
 * Datenschutzerklärung. Ältere Einträge räumt ein täglicher Lauf weg.
 */
export const ACTIVITY_RETENTION_DAYS = 365;

/** Obergrenze einer Ausgabe. Darüber hilft ein engerer Zeitraum. */
export const ACTIVITY_EXPORT_MAX_ROWS = 10_000;

/** Ergebnis der Kettenprüfung. */
export const activityChainReportSchema = z.object({
  checked: z.number().int(),
  sealed: z.number().int(),
  unsealed: z.number().int(),
  /** Laufende Nummer des ersten gebrochenen Eintrags, sonst null. */
  brokenAt: z.number().int().nullable(),
});

export type ActivityChainReport = z.infer<typeof activityChainReportSchema>;

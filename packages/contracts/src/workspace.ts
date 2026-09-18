import { z } from 'zod';

export const MEMBERSHIP_ROLES = ['owner', 'member', 'viewer', 'client'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Interne Rollen sehen Vertragswerte, Notizen und interne Kommentare. */
export const INTERNAL_ROLES: readonly MembershipRole[] = ['owner', 'member', 'viewer'];

/**
 * Wer ändern darf. `viewer` ist die Rolle für Buchhaltung, Praktikum oder
 * Vertretung: dieselbe Sicht wie das Team, aber kein einziger Schreibzugriff.
 * Die Grenze steht serverseitig an jeder ändernden Route, nicht in der
 * Oberfläche — ein ausgeblendeter Knopf ist keine Berechtigung.
 */
export const WRITING_ROLES: readonly MembershipRole[] = ['owner', 'member'];

export function isInternalRole(role: MembershipRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function isWritingRole(role: MembershipRole): boolean {
  return WRITING_ROLES.includes(role);
}

export const workspaceSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  timezone: z.string(),
  currency: z.literal('CHF'),
  role: z.enum(MEMBERSHIP_ROLES),
  isDemo: z.boolean(),
  /** Nur bei Rolle client gesetzt. */
  customerId: z.uuid().nullable(),
});

export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;

import { and, asc, eq } from 'drizzle-orm';
import { chainHash } from '../activity-chain.ts';
import type { Transaction } from '../client.ts';
import { activityEvents } from '../schema/activity.ts';
import { customers } from '../schema/customers.ts';
import { documents } from '../schema/documents.ts';
import { milestones, projects } from '../schema/projects.ts';
import { serviceContracts } from '../schema/service-contracts.ts';
import { serviceRequests } from '../schema/service-requests.ts';

/**
 * Das Protokoll des Vorführbestands.
 *
 * Der Seed schreibt seine Daten direkt in die Tabellen, nicht über die
 * Dienste — deshalb entstünde ohne diesen Schritt kein einziger Eintrag, und
 * die Demo zeigte ein leeres Protokoll. Die Ereignisse werden aus den
 * tatsächlich angelegten Zeilen abgeleitet, damit beides nicht auseinander
 * läuft, und über die letzten Wochen verteilt: ein Bestand, der in derselben
 * Sekunde entstanden ist, sieht aus wie das, was er ist.
 */

/** Über so viele Tage vor dem Bezugsdatum verteilen sich die Einträge. */
const SPREAD_DAYS = 45;

interface SeedEvent {
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata: Record<string, unknown>;
}

export async function seedActivityLog(
  tx: Transaction,
  options: { workspaceId: string; ownerUserId: string; reference: Date },
): Promise<number> {
  const { workspaceId, ownerUserId, reference } = options;
  const scope = eq(customers.workspaceId, workspaceId);

  const customerRows = await tx
    .select({ id: customers.id, name: customers.name, archivedAt: customers.archivedAt })
    .from(customers)
    .where(scope)
    .orderBy(asc(customers.createdAt));

  const projectRows = await tx
    .select({ id: projects.id, name: projects.name, customerId: projects.customerId })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(asc(projects.createdAt));

  const doneMilestones = await tx
    .select({ id: milestones.id, title: milestones.title, projectId: milestones.projectId })
    .from(milestones)
    .where(and(eq(milestones.workspaceId, workspaceId), eq(milestones.status, 'done')))
    .orderBy(asc(milestones.createdAt));

  const contractRows = await tx
    .select({
      id: serviceContracts.id,
      name: serviceContracts.name,
      customerId: serviceContracts.customerId,
    })
    .from(serviceContracts)
    .where(eq(serviceContracts.workspaceId, workspaceId))
    .orderBy(asc(serviceContracts.createdAt));

  const requestRows = await tx
    .select({
      id: serviceRequests.id,
      customerId: serviceRequests.customerId,
      priority: serviceRequests.priority,
      status: serviceRequests.status,
      createdBy: serviceRequests.createdBy,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.workspaceId, workspaceId))
    .orderBy(asc(serviceRequests.createdAt));

  const documentRows = await tx
    .select({
      id: documents.id,
      originalName: documents.originalName,
      customerId: documents.customerId,
      clientVisible: documents.clientVisible,
      uploadedBy: documents.uploadedBy,
    })
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(asc(documents.createdAt));

  const events: SeedEvent[] = [];
  const customerOfProject = new Map(projectRows.map((row) => [row.id, row.customerId]));

  /*
   * Erzählt je Kunde seine Geschichte, statt alle Kunden, dann alle Projekte,
   * dann alle Dokumente zu schreiben. Sonst stünden im Protokoll zwanzig Mal
   * dieselbe Handlung untereinander — und so arbeitet niemand.
   */
  for (const customer of customerRows) {
    events.push({
      action: 'customer.created',
      entityType: 'customer',
      entityId: customer.id,
      actorId: ownerUserId,
      metadata: { name: customer.name },
    });

    for (const row of projectRows.filter((entry) => entry.customerId === customer.id)) {
      events.push({
        action: 'project.created',
        entityType: 'project',
        entityId: row.id,
        actorId: ownerUserId,
        metadata: { name: row.name, customerId: customer.id },
      });
    }

    for (const row of contractRows.filter((entry) => entry.customerId === customer.id)) {
      events.push({
        action: 'contract.created',
        entityType: 'contract',
        entityId: row.id,
        actorId: ownerUserId,
        metadata: { name: row.name, customerId: customer.id },
      });
    }

    for (const row of doneMilestones.filter(
      (entry) => customerOfProject.get(entry.projectId) === customer.id,
    )) {
      events.push({
        action: 'milestone.completed',
        entityType: 'milestone',
        entityId: row.id,
        actorId: ownerUserId,
        metadata: { title: row.title },
      });
    }

    for (const row of documentRows.filter((entry) => entry.customerId === customer.id)) {
      events.push({
        action: 'document.uploaded',
        entityType: 'document',
        entityId: row.id,
        actorId: row.uploadedBy ?? ownerUserId,
        metadata: { originalName: row.originalName, customerId: customer.id },
      });
      if (row.clientVisible) {
        events.push({
          action: 'document.visibility_changed',
          entityType: 'document',
          entityId: row.id,
          actorId: ownerUserId,
          metadata: { clientVisible: true },
        });
      }
    }

    for (const row of requestRows.filter((entry) => entry.customerId === customer.id)) {
      events.push({
        action: 'request.created',
        entityType: 'request',
        entityId: row.id,
        actorId: row.createdBy ?? ownerUserId,
        metadata: { customerId: customer.id, priority: row.priority },
      });
      if (row.status !== 'open') {
        events.push({
          action: 'request.status_changed',
          entityType: 'request',
          entityId: row.id,
          actorId: ownerUserId,
          metadata: { from: 'open', to: row.status },
        });
      }
    }

    if (customer.archivedAt !== null) {
      events.push({
        action: 'customer.archived',
        entityType: 'customer',
        entityId: customer.id,
        actorId: ownerUserId,
        metadata: { name: customer.name },
      });
    }
  }

  if (events.length === 0) return 0;

  const step = (SPREAD_DAYS * 24 * 60 * 60 * 1000) / events.length;
  let previousHash: string | null = null;

  for (const [index, event] of events.entries()) {
    // Ältester Eintrag zuerst, der jüngste liegt rund einen Tag zurück.
    const createdAt = new Date(reference.getTime() - (events.length - index) * step);
    const fields = {
      workspaceId,
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      createdAt,
      previousHash,
    };
    const hash = chainHash(fields);

    await tx.insert(activityEvents).values({ ...fields, hash });
    previousHash = hash;
  }

  return events.length;
}

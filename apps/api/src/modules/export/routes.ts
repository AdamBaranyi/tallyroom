import { Router } from 'express';
import { z } from 'zod';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireOwner,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { HandoverService } from './handover.ts';
import type { ExportService } from './service.ts';

const idSchema = z.uuid();

/**
 * Zwei Auszüge mit zwei Berechtigungen.
 *
 * Der vollständige Auszug enthält interne Notizen und die Mitgliederliste und
 * gehört deshalb dem Owner. Das Übergabepaket enthält nur Freigegebenes;
 * dafür genügt eine interne Rolle, denn wer Dokumente freigeben darf, darf
 * sie auch zusammenpacken.
 */
export function createExportRouter(
  exportService: ExportService,
  handover: HandoverService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/workspace', requireOwner, async (req, res) => {
    const { workspaceId } = getWorkspace(req);
    send(res, await exportService.workspace(workspaceId));
  });

  router.get('/customers/:customerId', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { workspaceId, timezone } = getWorkspace(req);
    send(res, await handover.build(workspaceId, customerId, timezone));
  });

  return router;
}

interface Sendable {
  filename: string;
  bytes: Uint8Array;
}

function send(res: Parameters<Parameters<Router['get']>[1]>[1], file: Sendable): void {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Content-Length', String(file.bytes.length));
  // Buffer.from ohne Kopie: dieselben Bytes, andere Hülle.
  res.end(Buffer.from(file.bytes.buffer, file.bytes.byteOffset, file.bytes.byteLength));
}

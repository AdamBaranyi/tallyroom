import { Router } from 'express';
import {
  activityExportQuerySchema,
  activityListQuerySchema,
  paginationQuerySchema,
} from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { ActivityService } from './service.ts';

/**
 * Das Protokoll ist eine interne Sicht. Ein Kundenzugang bekommt hier 404:
 * Wer im Portal arbeitet, sieht seinen eigenen Verlauf an den Anfragen, nicht
 * die Handlungen des Teams.
 */
export function createActivityRouter(
  service: ActivityService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = activityListQuerySchema.parse(req.query);
    const page = paginationQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await service.list(workspaceId, { ...query, timezone }, page));
  });

  router.get('/export', async (req, res) => {
    const { format, ...query } = activityExportQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    const file = await service.export(workspaceId, { ...query, timezone }, format);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    // Damit die Oberfläche sagen kann, dass die Datei gekürzt ist.
    res.setHeader('X-Export-Truncated', String(file.truncated));
    res.send(file.body);
  });

  /** Prüfung der Hash-Kette, auch über die Oberfläche auslösbar. */
  router.get('/integrity', async (req, res) => {
    const { workspaceId } = getWorkspace(req);
    res.json(await service.verify(workspaceId));
  });

  return router;
}

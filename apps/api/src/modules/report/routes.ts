import { Router } from 'express';
import { z } from 'zod';
import { reportQuerySchema } from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { ReportService } from './service.ts';

const idSchema = z.uuid();

/**
 * Der Bericht aus der Teamansicht. Dieselbe Sicht bekommt der Kunde im Portal
 * über seinen eigenen Weg — ein Bericht, den nur das Team sähe, wäre keiner.
 */
export function createReportRouter(service: ReportService, authRepository: AuthRepository): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/:customerId', async (req, res) => {
    const customerId = idSchema.parse(req.params.customerId);
    const { month } = reportQuerySchema.parse(req.query);
    const { workspaceId, timezone } = getWorkspace(req);
    res.json(await service.build(workspaceId, customerId, timezone, month));
  });

  return router;
}

import { Router } from 'express';
import { cattleSchema, cattleExitSchema, updateCattleSchema } from '../schemas/resourceSchemas.js';
import { promoteCattleStagesByAge } from '../utils/lifecycle.js';
import { canDeleteCattle, canWriteCattle } from '../utils/permissions.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { ApiError } from '../utils/apiError.js';
import { exitCattle } from '../services/cattleExitService.js';

const cattleCrud = createCrudRouter({
  model: models.cattle,
  resourceName: 'Cattle',
  createSchema: cattleSchema,
  updateSchema: updateCattleSchema,
  defaultOrderBy: { createdAt: 'desc' },
  beforeList: async () => {
    await promoteCattleStagesByAge();
  },
  canCreate: (auth) => canWriteCattle(auth),
  canUpdate: (auth) => canWriteCattle(auth),
  canDelete: (auth) => canDeleteCattle(auth),
  trackActor: true,
  softDelete: true,
  auditEntityType: 'Cattle',
});

export const cattleRouter = Router();

cattleRouter.post(
  '/:id/exit',
  validateBody(cattleExitSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    if (!canWriteCattle(auth)) {
      throw new ApiError(403, 'You do not have permission to record cattle exits.');
    }

    const body = request.body as {
      status: 'SOLD' | 'CULLED' | 'DEAD' | 'INACTIVE';
      exitDate: Date;
      reason?: string;
      amount?: number;
      buyerVendor?: string;
      paymentMethod?: string;
    };

    const result = await exitCattle(String(request.params.id), body, auth);
    response.json(result);
  }),
);

cattleRouter.use(cattleCrud);

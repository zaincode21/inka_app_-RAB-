import { Router } from 'express';
import { farmSchema, updateFarmSchema } from '../schemas/resourceSchemas.js';
import { getSystemConfig, patchSystemConfig } from '../controllers/farmController.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

const farmCrud = createCrudRouter({
  model: models.farm,
  resourceName: 'Farm',
  createSchema: farmSchema,
  updateSchema: updateFarmSchema,
  defaultOrderBy: { createdAt: 'desc' },
});

export const farmRouter = Router();

farmRouter.get('/system-config', getSystemConfig);
farmRouter.patch('/system-config', patchSystemConfig);
farmRouter.use(farmCrud);

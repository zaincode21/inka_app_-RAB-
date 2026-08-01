import { cattleSchema, updateCattleSchema } from '../schemas/resourceSchemas.js';
import { promoteCattleStagesByAge } from '../utils/lifecycle.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

export const cattleRouter = createCrudRouter({
  model: models.cattle,
  resourceName: 'Cattle',
  createSchema: cattleSchema,
  updateSchema: updateCattleSchema,
  defaultOrderBy: { createdAt: 'desc' },
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
  }),
  beforeList: async () => {
    await promoteCattleStagesByAge();
  },
});

import { cattleSchema, updateCattleSchema } from '../schemas/resourceSchemas.js';
import { promoteCattleStagesByAge } from '../utils/lifecycle.js';
import { canDeleteCattle, canWriteCattle } from '../utils/permissions.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

export const cattleRouter = createCrudRouter({
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

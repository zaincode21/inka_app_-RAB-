import { categorySchema, updateCategorySchema } from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';
import { ApiError } from '../utils/apiError.js';
import { canManageFarmSetup } from '../utils/permissions.js';
import { resolveFarmIdForRequest, seedFarmCategories } from '../services/farmService.js';

export const categoryRouter = createCrudRouter({
  model: models.category,
  resourceName: 'Category',
  createSchema: categorySchema,
  updateSchema: updateCategorySchema,
  defaultOrderBy: { name: 'asc' },
  listWhere: (query) => ({
    ...(typeof query.kind === 'string' ? { kind: query.kind } : {}),
  }),
  beforeList: async (auth) => {
    try {
      const farmId = await resolveFarmIdForRequest(auth);
      await seedFarmCategories(farmId);
    } catch {
      // Super Admin without a farm context has nothing to seed.
    }
  },
  beforeCreate: async (_body, auth) => {
    if (!canManageFarmSetup(auth)) {
      throw new ApiError(403, 'Only farm owners can change farm setup categories.');
    }
  },
  beforeUpdate: async (_id, _body, auth) => {
    if (!canManageFarmSetup(auth)) {
      throw new ApiError(403, 'Only farm owners can change farm setup categories.');
    }
  },
  canDelete: (auth) => canManageFarmSetup(auth),
});

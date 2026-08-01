import { categorySchema, updateCategorySchema } from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

export const categoryRouter = createCrudRouter({
  model: models.category,
  resourceName: 'Category',
  createSchema: categorySchema,
  updateSchema: updateCategorySchema,
  defaultOrderBy: { name: 'asc' },
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
    ...(typeof query.kind === 'string' ? { kind: query.kind } : {}),
  }),
});

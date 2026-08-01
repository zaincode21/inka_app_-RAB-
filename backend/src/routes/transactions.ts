import { transactionSchema, updateTransactionSchema } from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

export const transactionRouter = createCrudRouter({
  model: models.transaction,
  resourceName: 'Transaction',
  createSchema: transactionSchema,
  updateSchema: updateTransactionSchema,
  defaultOrderBy: { date: 'desc' },
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
    ...(typeof query.kind === 'string' ? { kind: query.kind.toUpperCase() } : {}),
  }),
});

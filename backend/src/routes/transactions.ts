import { transactionSchema, updateTransactionSchema } from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';
import { ApiError } from '../utils/apiError.js';
import { canDeleteTransactions, canViewFinance, canWriteFinance } from '../utils/permissions.js';

export const transactionRouter = createCrudRouter({
  model: models.transaction,
  resourceName: 'Transaction',
  createSchema: transactionSchema,
  updateSchema: updateTransactionSchema,
  defaultOrderBy: { date: 'desc' },
  listWhere: (query) => ({
    ...(typeof query.kind === 'string' ? { kind: query.kind.toUpperCase() } : {}),
  }),
  beforeList: async (auth) => {
    if (!canViewFinance(auth)) {
      throw new ApiError(403, 'You do not have permission to view financial records.');
    }
  },
  assertRecordAccess: (auth) => {
    if (!canViewFinance(auth)) {
      throw new ApiError(403, 'You do not have permission to view financial records.');
    }
  },
  canCreate: (auth) => canWriteFinance(auth),
  canUpdate: (auth) => canWriteFinance(auth),
  canDelete: (auth) => canDeleteTransactions(auth),
  trackActor: true,
  softDelete: true,
  auditEntityType: 'Transaction',
});

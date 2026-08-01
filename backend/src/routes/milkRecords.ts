import { milkRecordSchema, updateMilkRecordSchema } from '../schemas/resourceSchemas.js';
import { deleteLinkedMilkSales, restoreLinkedMilkSales, syncMilkSaleIncome, withMilkTotal } from '../services/milkService.js';
import { assertCattleIsActive } from '../services/cattleExitService.js';
import { canDeleteMilk, canWriteMilk } from '../utils/permissions.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

export const milkRecordRouter = createCrudRouter({
  model: models.milkRecord,
  resourceName: 'Milk record',
  createSchema: milkRecordSchema,
  updateSchema: updateMilkRecordSchema,
  defaultOrderBy: { date: 'desc' },
  include: {
    cattle: {
      select: {
        id: true,
        tagNumber: true,
        name: true,
      },
    },
  },
  createData: (body) => withMilkTotal(body),
  updateData: (body) => withMilkTotal(body),
  beforeCreate: async (body) => {
    await assertCattleIsActive(typeof body.cattleId === 'string' ? body.cattleId : null);
  },
  beforeUpdate: async (_id, body) => {
    await assertCattleIsActive(typeof body.cattleId === 'string' ? body.cattleId : null);
  },
  afterCreate: async (body, record, auth) => {
    await syncMilkSaleIncome(body, record, true, auth.id);
  },
  afterUpdate: async (_id, body, record, auth) => {
    await syncMilkSaleIncome(body, record, false, auth.id);
  },
  beforeDelete: async (id, _existing, auth) => {
    await deleteLinkedMilkSales(id, auth.id);
  },
  afterRestore: async (id) => {
    await restoreLinkedMilkSales(id);
  },
  canCreate: (auth) => canWriteMilk(auth),
  canUpdate: (auth) => canWriteMilk(auth),
  canDelete: (auth) => canDeleteMilk(auth),
  trackActor: true,
  softDelete: true,
  auditEntityType: 'MilkRecord',
});

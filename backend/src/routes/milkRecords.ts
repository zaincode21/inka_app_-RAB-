import { milkRecordSchema, updateMilkRecordSchema } from '../schemas/resourceSchemas.js';
import { deleteLinkedMilkSales, syncMilkSaleIncome, withMilkTotal } from '../services/milkService.js';
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
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
  }),
  createData: withMilkTotal,
  updateData: withMilkTotal,
  afterCreate: async (body, record) => {
    await syncMilkSaleIncome(body, record, true);
  },
  afterUpdate: async (_id, body, record) => {
    await syncMilkSaleIncome(body, record, false);
  },
  beforeDelete: async (id) => {
    await deleteLinkedMilkSales(id);
  },
});

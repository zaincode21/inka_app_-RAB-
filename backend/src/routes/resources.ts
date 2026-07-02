import { Router } from 'express';
import {
  categorySchema,
  cattleSchema,
  farmSchema,
  healthEventSchema,
  milkRecordSchema,
  transactionSchema,
  updateCategorySchema,
  updateCattleSchema,
  updateFarmSchema,
  updateHealthEventSchema,
  updateMilkRecordSchema,
  updateTransactionSchema,
} from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from './crudRouter.js';

export const farmRouter = createCrudRouter({
  model: models.farm,
  resourceName: 'Farm',
  createSchema: farmSchema,
  updateSchema: updateFarmSchema,
  defaultOrderBy: { createdAt: 'desc' },
});

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

export const cattleRouter = createCrudRouter({
  model: models.cattle,
  resourceName: 'Cattle',
  createSchema: cattleSchema,
  updateSchema: updateCattleSchema,
  defaultOrderBy: { createdAt: 'desc' },
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
  }),
});

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
});

export const healthEventRouter = createCrudRouter({
  model: models.healthEvent,
  resourceName: 'Health event',
  createSchema: healthEventSchema,
  updateSchema: updateHealthEventSchema,
  defaultOrderBy: { eventDate: 'desc' },
  include: {
    cattle: {
      select: {
        id: true,
        tagNumber: true,
      },
    },
  },
  listWhere: (query) => ({
    ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
  }),
});

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

export const attachmentRouter = Router();

function withMilkTotal(body: Record<string, unknown>) {
  const amTotal = Number(body.amTotal ?? 0);
  const noonTotal = Number(body.noonTotal ?? 0);
  const pmTotal = Number(body.pmTotal ?? 0);
  return {
    ...body,
    totalProduced: body.totalProduced ?? amTotal + noonTotal + pmTotal,
  };
}

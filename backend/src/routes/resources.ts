import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
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

export const healthEventCrud = createCrudRouter({
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
    ...(typeof query.eventType === 'string'
      ? { eventType: { equals: query.eventType, mode: 'insensitive' as const } }
      : {}),
    ...(typeof query.cattleTag === 'string' ? { cattle: { tagNumber: query.cattleTag } } : {}),
    ...(typeof query.cattleId === 'string' ? { cattleId: query.cattleId } : {}),
    ...(typeof query.scope === 'string' ? { scope: query.scope.toUpperCase() } : {}),
  }),
  beforeCreate: async (body) => {
    assertRequiredHealthEventDetails(body);
    await assertFemaleCattleForReproductiveEvent(body);
  },
  beforeUpdate: async (id, body) => {
    const existing = await prisma.healthEvent.findUnique({
      where: { id },
      select: { eventType: true, cattleId: true, bullResponsible: true },
    });
    if (!existing) {
      return;
    }

    const eventType = typeof body.eventType === 'string' ? body.eventType : existing.eventType;
    const cattleId = typeof body.cattleId === 'string' ? body.cattleId : existing.cattleId;
    const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible : existing.bullResponsible;
    assertRequiredHealthEventDetails({ eventType, bullResponsible });
    await assertFemaleCattleForReproductiveEvent({ eventType, cattleId });
  },
});

export const healthEventRouter = Router();

healthEventRouter.get(
  '/latest-breeding',
  asyncHandler(async (request, response) => {
    const cattleTag = typeof request.query.cattleTag === 'string' ? request.query.cattleTag.trim() : '';
    if (!cattleTag) {
      throw new ApiError(400, 'cattleTag query parameter is required.');
    }

    const event = await prisma.healthEvent.findFirst({
      where: {
        scope: 'INDIVIDUAL',
        eventType: { equals: 'Breeding', mode: 'insensitive' },
        cattle: { tagNumber: cattleTag },
      },
      orderBy: { eventDate: 'desc' },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
          },
        },
      },
    });

    response.json(event);
  }),
);

healthEventRouter.get(
  '/birth-prefill',
  asyncHandler(async (request, response) => {
    const cattleTag = typeof request.query.cattleTag === 'string' ? request.query.cattleTag.trim() : '';
    if (!cattleTag) {
      throw new ApiError(400, 'cattleTag query parameter is required.');
    }

    const includeCattle = {
      cattle: {
        select: {
          id: true,
          tagNumber: true,
        },
      },
    };

    const commonWhere = {
      scope: 'INDIVIDUAL' as const,
      cattle: { tagNumber: cattleTag },
    };

    const pregnancy = await prisma.healthEvent.findFirst({
      where: {
        ...commonWhere,
        eventType: { equals: 'Pregnant', mode: 'insensitive' },
      },
      orderBy: { eventDate: 'desc' },
      include: includeCattle,
    });

    if (pregnancy) {
      response.json(pregnancy);
      return;
    }

    const breeding = await prisma.healthEvent.findFirst({
      where: {
        ...commonWhere,
        eventType: { equals: 'Breeding', mode: 'insensitive' },
      },
      orderBy: { eventDate: 'desc' },
      include: includeCattle,
    });

    response.json(breeding);
  }),
);

healthEventRouter.use(healthEventCrud);

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

const femaleOnlyEventTypes = new Set(['breeding', 'pregnant', 'aborted']);

function isFemaleOnlyEventType(eventType: string): boolean {
  return femaleOnlyEventTypes.has(eventType.trim().toLowerCase());
}

function assertRequiredHealthEventDetails(body: Record<string, unknown>): void {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';

  if (eventType === 'giving birth' && !bullResponsible) {
    throw new ApiError(400, 'Bull name is required for Giving Birth events.');
  }
}

async function assertFemaleCattleForReproductiveEvent(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType : '';
  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;

  if (!isFemaleOnlyEventType(eventType) || !cattleId) {
    return;
  }

  const cattle = await prisma.cattle.findUnique({
    where: { id: cattleId },
    select: { sex: true },
  });

  if (!cattle || cattle.sex !== 'FEMALE') {
    throw new ApiError(400, 'Breeding, Pregnant, and Aborted events can only be recorded for female cattle.');
  }
}

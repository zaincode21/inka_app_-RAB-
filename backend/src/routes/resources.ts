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
  systemConfigSchema,
  transactionSchema,
  updateCategorySchema,
  updateCattleSchema,
  updateFarmSchema,
  updateHealthEventSchema,
  updateMilkRecordSchema,
  updateTransactionSchema,
} from '../schemas/resourceSchemas.js';
import { createCrudRouter, models } from './crudRouter.js';
import { assertNoInbreedingForHealthEvent } from '../utils/inbreeding.js';
import { promoteCattleStagesByAge } from '../utils/lifecycle.js';

const DEFAULT_FARM_ID = 'default-farm';

async function ensureDefaultFarm() {
  return prisma.farm.upsert({
    where: { id: DEFAULT_FARM_ID },
    update: {},
    create: {
      id: DEFAULT_FARM_ID,
      name: 'Inka Farm',
      ownerName: 'Farm Manager',
      location: 'Rwanda',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
    },
  });
}

const farmCrud = createCrudRouter({
  model: models.farm,
  resourceName: 'Farm',
  createSchema: farmSchema,
  updateSchema: updateFarmSchema,
  defaultOrderBy: { createdAt: 'desc' },
});

export const farmRouter = Router();

farmRouter.get(
  '/system-config',
  asyncHandler(async (_request, response) => {
    const farm = await ensureDefaultFarm();
    response.json({
      farmId: farm.id,
      name: farm.name,
      currency: farm.currency,
      weightUnit: farm.weightUnit,
      milkUnit: farm.milkUnit,
      returnHeatDays: farm.returnHeatDays,
      returnHeatTime: farm.returnHeatTime,
    });
  }),
);

farmRouter.patch(
  '/system-config',
  asyncHandler(async (request, response) => {
    const body = systemConfigSchema.parse(request.body);
    await ensureDefaultFarm();
    const farm = await prisma.farm.update({
      where: { id: DEFAULT_FARM_ID },
      data: {
        returnHeatDays: body.returnHeatDays,
        returnHeatTime: body.returnHeatTime,
      },
    });
    response.json({
      farmId: farm.id,
      name: farm.name,
      currency: farm.currency,
      weightUnit: farm.weightUnit,
      milkUnit: farm.milkUnit,
      returnHeatDays: farm.returnHeatDays,
      returnHeatTime: farm.returnHeatTime,
    });
  }),
);

farmRouter.use(farmCrud);

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
  beforeList: async () => {
    await promoteCattleStagesByAge();
  },
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
  listWhere: (query) => {
    const where: Record<string, unknown> = {
      ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
      ...(typeof query.eventType === 'string'
        ? { eventType: { equals: query.eventType, mode: 'insensitive' as const } }
        : {}),
      ...(typeof query.cattleTag === 'string' ? { cattle: { tagNumber: query.cattleTag } } : {}),
      ...(typeof query.cattleId === 'string' ? { cattleId: query.cattleId } : {}),
      ...(typeof query.scope === 'string' ? { scope: query.scope.toUpperCase() } : {}),
    };

    if (query.followUpDue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.followUpDate = { lte: today, not: null };
    }

    return where;
  },
  createData: stripHealthEventExtras,
  updateData: stripHealthEventExtras,
  beforeCreate: async (body) => {
    await resolveGivingBirthDetails(body);
    assertRequiredHealthEventDetails(body);
    await assertFemaleCattleForReproductiveEvent(body);
    await assertNoInbreedingForHealthEvent(body);
    await assertNoDuplicateOpenPregnancy(body);
  },
  beforeUpdate: async (id, body) => {
    const existing = await prisma.healthEvent.findUnique({
      where: { id },
      select: { eventType: true, cattleId: true, bullResponsible: true, calfTag: true, calfGender: true },
    });
    if (!existing) {
      return;
    }

    const eventType = typeof body.eventType === 'string' ? body.eventType : existing.eventType;
    const cattleId = typeof body.cattleId === 'string' ? body.cattleId : existing.cattleId;
    const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible : existing.bullResponsible;
    const calfTag = typeof body.calfTag === 'string' ? body.calfTag : existing.calfTag;
    const calfGender = typeof body.calfGender === 'string' ? body.calfGender : existing.calfGender;
    assertRequiredHealthEventDetails({ eventType, bullResponsible, calfTag, calfGender });
    await assertFemaleCattleForReproductiveEvent({ eventType, cattleId });
    await assertNoInbreedingForHealthEvent({ eventType, cattleId, bullResponsible });
  },
  afterCreate: async (body, record) => {
    await registerCalfFromBirthEvent(body, record);
    await syncCattleFromHealthEvent(body, record);
    await linkTreatmentCost(body, record);
  },
  afterUpdate: async (_id, body, record) => {
    await syncCattleFromHealthEvent(body, record);
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

healthEventRouter.get(
  '/milk-withdrawal',
  asyncHandler(async (request, response) => {
    const cattleTag = typeof request.query.cattleTag === 'string' ? request.query.cattleTag.trim() : '';
    if (!cattleTag) {
      throw new ApiError(400, 'cattleTag query parameter is required.');
    }

    const onDateRaw = typeof request.query.onDate === 'string' ? request.query.onDate.trim() : '';
    const onDate = onDateRaw ? new Date(`${onDateRaw}T00:00:00`) : new Date();
    if (Number.isNaN(onDate.getTime())) {
      throw new ApiError(400, 'onDate must be a valid YYYY-MM-DD date.');
    }
    onDate.setHours(0, 0, 0, 0);

    const events = await prisma.healthEvent.findMany({
      where: {
        scope: 'INDIVIDUAL',
        cattle: { tagNumber: cattleTag },
        withdrawalDays: { gt: 0 },
      },
      orderBy: { eventDate: 'desc' },
      take: 40,
      select: {
        id: true,
        eventDate: true,
        eventType: true,
        medicine: true,
        withdrawalDays: true,
      },
    });

    let active: {
      eventId: string;
      eventType: string;
      medicine: string;
      eventDate: string;
      withdrawalDays: number;
      withdrawalEndsOn: string;
    } | null = null;

    for (const event of events) {
      const days = Number(event.withdrawalDays ?? 0);
      if (!Number.isFinite(days) || days <= 0) {
        continue;
      }
      const start = new Date(event.eventDate);
      start.setHours(0, 0, 0, 0);
      const ends = new Date(start);
      ends.setDate(ends.getDate() + Math.ceil(days));
      if (onDate.getTime() <= ends.getTime()) {
        const iso = (value: Date) => value.toISOString().slice(0, 10);
        active = {
          eventId: event.id,
          eventType: event.eventType,
          medicine: event.medicine?.trim() || 'Medicine',
          eventDate: iso(start),
          withdrawalDays: days,
          withdrawalEndsOn: iso(ends),
        };
        break;
      }
    }

    response.json({
      cattleTag,
      onDate: onDate.toISOString().slice(0, 10),
      underWithdrawal: Boolean(active),
      active,
    });
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

const femaleOnlyEventTypes = new Set([
  'breeding',
  'pregnant',
  'aborted',
  'giving birth',
  'pregnancy diagnosis',
  'dry off',
  'mastitis',
  'heat observed',
]);

function stripHealthEventExtras(body: Record<string, unknown>) {
  const { treatmentCost: _treatmentCost, ...data } = body;
  return data;
}

function normalizeEventType(eventType: string): string {
  return eventType.trim().toLowerCase();
}

async function syncCattleFromHealthEvent(body: Record<string, unknown>, record: Record<string, unknown>): Promise<void> {
  const cattleId =
    typeof body.cattleId === 'string'
      ? body.cattleId
      : typeof record.cattleId === 'string'
        ? record.cattleId
        : null;

  if (!cattleId) {
    return;
  }

  const eventType = normalizeEventType(
    typeof body.eventType === 'string' ? body.eventType : typeof record.eventType === 'string' ? record.eventType : '',
  );

  const updateData: {
    weightKg?: number;
    bodyConditionScore?: number;
    reproductiveStatus?: 'OPEN' | 'BRED' | 'PREGNANT' | 'DRY' | 'LACTATING' | 'NOT_APPLICABLE';
    status?: 'ACTIVE' | 'SOLD' | 'CULLED' | 'DEAD' | 'INACTIVE';
    stage?: 'CALF' | 'WEANER' | 'HEIFER' | 'COW' | 'BULL' | 'STEER';
    parity?: { increment: number };
    lactationNumber?: { increment: number };
  } = {};

  const weightKg = Number(body.weightKg ?? record.weightKg ?? 0);
  const bodyConditionScore = Number(body.bodyConditionScore ?? record.bodyConditionScore ?? 0);

  switch (eventType) {
    case 'weighed':
      if (weightKg > 0) {
        updateData.weightKg = weightKg;
      }
      if (bodyConditionScore > 0) {
        updateData.bodyConditionScore = bodyConditionScore;
      }
      break;
    case 'breeding':
    case 'heat observed':
      updateData.reproductiveStatus = 'BRED';
      break;
    case 'pregnant':
    case 'pregnancy diagnosis':
      updateData.reproductiveStatus = 'PREGNANT';
      break;
    case 'giving birth':
      updateData.reproductiveStatus = 'LACTATING';
      updateData.parity = { increment: 1 };
      updateData.lactationNumber = { increment: 1 };
      updateData.stage = 'COW';
      break;
    case 'aborted':
      updateData.reproductiveStatus = 'OPEN';
      break;
    case 'dry off':
      updateData.reproductiveStatus = 'DRY';
      break;
    case 'death':
    case 'euthanasia':
      updateData.status = 'DEAD';
      break;
    default:
      break;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await prisma.cattle.update({
    where: { id: cattleId },
    data: updateData,
  });
}

async function linkTreatmentCost(body: Record<string, unknown>, record: Record<string, unknown>): Promise<void> {
  const treatmentCost = Number(body.treatmentCost ?? 0);
  const eventId = typeof record.id === 'string' ? record.id : null;

  if (!eventId || treatmentCost <= 0) {
    return;
  }

  const eventType = typeof body.eventType === 'string' ? body.eventType : typeof record.eventType === 'string' ? record.eventType : 'Treatment';
  const medicine = typeof body.medicine === 'string' ? body.medicine.trim() : '';
  const cattleId =
    typeof body.cattleId === 'string'
      ? body.cattleId
      : typeof record.cattleId === 'string'
        ? record.cattleId
        : undefined;
  const farmId =
    typeof body.farmId === 'string' ? body.farmId : typeof record.farmId === 'string' ? record.farmId : undefined;
  const eventDate = body.eventDate instanceof Date ? body.eventDate : record.eventDate instanceof Date ? record.eventDate : new Date();

  await prisma.transaction.create({
    data: {
      farmId,
      cattleId,
      healthEventId: eventId,
      kind: 'EXPENSE',
      date: eventDate,
      category: 'Veterinary',
      title: medicine ? `${eventType} - ${medicine}` : eventType,
      amount: treatmentCost,
      notes: 'Linked from health event',
    },
  });
}

function isFemaleOnlyEventType(eventType: string): boolean {
  return femaleOnlyEventTypes.has(eventType.trim().toLowerCase());
}

function assertRequiredHealthEventDetails(body: Record<string, unknown>): void {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';
  const calfName = typeof body.calfTag === 'string' ? body.calfTag.trim() : '';
  const calfGender = typeof body.calfGender === 'string' ? body.calfGender.trim().toUpperCase() : '';

  if (eventType !== 'giving birth') {
    return;
  }

  if (!bullResponsible) {
    throw new ApiError(400, 'Bull name is required for Giving Birth events.');
  }
  if (!calfName) {
    throw new ApiError(400, 'Calf name is required for Giving Birth events.');
  }
  if (calfGender !== 'MALE' && calfGender !== 'FEMALE') {
    throw new ApiError(400, 'Calf gender is required for Giving Birth events.');
  }
}

async function assertNoDuplicateOpenPregnancy(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (eventType !== 'pregnant') {
    return;
  }

  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;
  if (!cattleId) {
    return;
  }

  const pregnancies = await prisma.healthEvent.findMany({
    where: {
      cattleId,
      scope: 'INDIVIDUAL',
      eventType: { equals: 'Pregnant', mode: 'insensitive' },
    },
    orderBy: { eventDate: 'desc' },
    select: { id: true, eventDate: true },
  });

  for (const pregnancy of pregnancies) {
    const closer = await prisma.healthEvent.findFirst({
      where: {
        cattleId,
        scope: 'INDIVIDUAL',
        OR: [
          { sourceEventId: pregnancy.id, eventType: { equals: 'Aborted', mode: 'insensitive' } },
          { sourceEventId: pregnancy.id, eventType: { equals: 'Giving Birth', mode: 'insensitive' } },
          { eventDate: { gte: pregnancy.eventDate }, eventType: { equals: 'Aborted', mode: 'insensitive' } },
          { eventDate: { gte: pregnancy.eventDate }, eventType: { equals: 'Giving Birth', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (!closer) {
      throw new ApiError(400, 'This animal already has an open Gusama (Pregnant) record. Close it with Kuramburura or Kubyara first.');
    }
  }
}

async function resolveGivingBirthDetails(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (eventType !== 'giving birth') {
    return;
  }

  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;
  if (!cattleId) {
    return;
  }

  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';
  if (bullResponsible) {
    return;
  }

  const prefill = await resolveBirthPrefillForCattle(cattleId);
  const resolvedBull = prefill?.bullResponsible?.trim() || prefill?.semenUsed?.trim() || '';
  if (resolvedBull) {
    body.bullResponsible = resolvedBull;
  }
}

async function resolveBirthPrefillForCattle(cattleId: string) {
  const commonWhere = {
    scope: 'INDIVIDUAL' as const,
    cattleId,
  };

  const pregnancy = await prisma.healthEvent.findFirst({
    where: {
      ...commonWhere,
      eventType: { equals: 'Pregnant', mode: 'insensitive' },
    },
    orderBy: { eventDate: 'desc' },
  });

  if (pregnancy) {
    return pregnancy;
  }

  return prisma.healthEvent.findFirst({
    where: {
      ...commonWhere,
      eventType: { equals: 'Breeding', mode: 'insensitive' },
    },
    orderBy: { eventDate: 'desc' },
  });
}

async function registerCalfFromBirthEvent(body: Record<string, unknown>, record: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (eventType !== 'giving birth') {
    return;
  }

  const calfName = typeof body.calfTag === 'string' ? body.calfTag.trim() : '';
  const calfGender = typeof body.calfGender === 'string' ? body.calfGender.trim().toUpperCase() : '';
  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;

  if (!calfName || (calfGender !== 'MALE' && calfGender !== 'FEMALE') || !cattleId) {
    return;
  }

  const mother = await prisma.cattle.findUnique({
    where: { id: cattleId },
    select: {
      id: true,
      farmId: true,
      tagNumber: true,
      breed: true,
      groupName: true,
    },
  });

  if (!mother) {
    throw new ApiError(400, 'Mother cow not found for calf registration.');
  }

  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';
  const eventDate = body.eventDate instanceof Date ? body.eventDate : new Date(String(body.eventDate));

  try {
    const tagNumber = await generateUniqueCalfTag(mother.tagNumber, calfName);

    await prisma.cattle.create({
      data: {
        farmId: typeof body.farmId === 'string' ? body.farmId : mother.farmId,
        tagNumber,
        name: calfName,
        breed: mother.breed,
        sex: calfGender as 'MALE' | 'FEMALE',
        stage: 'CALF',
        status: 'ACTIVE',
        groupName: 'Calves',
        dateOfBirth: eventDate,
        entryDate: eventDate,
        motherTag: mother.tagNumber,
        fatherTag: bullResponsible || undefined,
        source: 'Born on farm',
        notes: `Registered from Giving Birth event ${String(record.id ?? '')}`.trim(),
      },
    });
  } catch (error) {
    const eventId = typeof record.id === 'string' ? record.id : null;
    if (eventId) {
      await prisma.healthEvent.delete({ where: { id: eventId } }).catch(() => undefined);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, 'Could not register calf from Giving Birth event.');
  }
}

async function generateUniqueCalfTag(motherTag: string, calfName: string): Promise<string> {
  const sanitizedName = calfName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);
  const base = `${motherTag}-${sanitizedName || 'calf'}`.replace(/--+/g, '-');
  let candidate = base;
  let suffix = 1;

  while (await prisma.cattle.findUnique({ where: { tagNumber: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
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
    throw new ApiError(400, 'This reproductive or female-only event can only be recorded for female cattle.');
  }
}

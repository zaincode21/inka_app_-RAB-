import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { assertNoInbreedingForHealthEvent } from '../utils/inbreeding.js';
import { notDeleted, softDeleteData } from '../utils/softDelete.js';
import { assertCattleIsActive } from './cattleExitService.js';

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

const cattleSelect = {
  cattle: {
    select: {
      id: true,
      tagNumber: true,
    },
  },
};

export function stripHealthEventExtras(body: Record<string, unknown>) {
  const { treatmentCost: _treatmentCost, ...data } = body;
  return data;
}

function normalizeEventType(eventType: string): string {
  return eventType.trim().toLowerCase();
}

function isFemaleOnlyEventType(eventType: string): boolean {
  return femaleOnlyEventTypes.has(eventType.trim().toLowerCase());
}

export function assertRequiredHealthEventDetails(body: Record<string, unknown>): void {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';
  const calfName = typeof body.calfTag === 'string' ? body.calfTag.trim() : '';
  const calfGender = typeof body.calfGender === 'string' ? body.calfGender.trim().toUpperCase() : '';
  const treatmentCost = Number(body.treatmentCost ?? 0);

  const semenUsed = typeof body.semenUsed === 'string' ? body.semenUsed.trim() : '';
  const isAiBreeding = eventType === 'breeding' && Boolean(semenUsed);

  if (eventType === 'treated' && !(treatmentCost > 0)) {
    throw new ApiError(400, 'Treatment cost is required for Treated events so they are recorded as an expense.');
  }
  if (isAiBreeding && !(treatmentCost > 0)) {
    throw new ApiError(400, 'AI cost is required for Breeding (AI) events so they are recorded as an expense.');
  }

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

async function cattleHasOpenPregnancy(cattleId: string): Promise<boolean> {
  const pregnancies = await prisma.healthEvent.findMany({
    where: {
      cattleId,
      scope: 'INDIVIDUAL',
      eventType: { equals: 'Pregnant', mode: 'insensitive' },
      ...notDeleted,
    },
    orderBy: { eventDate: 'desc' },
    select: { id: true, eventDate: true },
  });

  for (const pregnancy of pregnancies) {
    const closer = await prisma.healthEvent.findFirst({
      where: {
        cattleId,
        scope: 'INDIVIDUAL',
        ...notDeleted,
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
      return true;
    }
  }

  return false;
}

export async function assertFemaleCattleForReproductiveEvent(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType : '';
  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;

  if (!isFemaleOnlyEventType(eventType) || !cattleId) {
    return;
  }

  const cattle = await prisma.cattle.findUnique({
    where: { id: cattleId },
    select: { sex: true, deletedAt: true },
  });

  if (!cattle || cattle.deletedAt || cattle.sex !== 'FEMALE') {
    throw new ApiError(400, 'This reproductive or female-only event can only be recorded for female cattle.');
  }
}

export async function assertNoDuplicateOpenPregnancy(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (eventType !== 'pregnant') {
    return;
  }

  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;
  if (!cattleId) {
    return;
  }

  if (await cattleHasOpenPregnancy(cattleId)) {
    throw new ApiError(400, 'This animal already has an open Gusama (Pregnant) record. Close it with Kuramburura or Kubyara first.');
  }
}

export async function assertEligibleCattleForCowReproductiveEvent(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (!['breeding', 'pregnant', 'aborted', 'giving birth'].includes(eventType)) {
    return;
  }

  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;
  if (!cattleId) {
    return;
  }

  const cattle = await prisma.cattle.findUnique({
    where: { id: cattleId },
    select: { sex: true, stage: true, reproductiveStatus: true, deletedAt: true },
  });

  if (!cattle || cattle.deletedAt) {
    throw new ApiError(400, 'The selected animal could not be found.');
  }
  if (cattle.sex !== 'FEMALE') {
    throw new ApiError(400, 'This event can only be recorded for female cattle.');
  }
  if (cattle.stage !== 'HEIFER' && cattle.stage !== 'COW') {
    throw new ApiError(400, 'Breeding, pregnancy, abort, and birth are for heifers and cows.');
  }
  if (eventType === 'breeding' && (cattle.reproductiveStatus === 'PREGNANT' || cattle.reproductiveStatus === 'DRY')) {
    throw new ApiError(400, 'This animal is already pregnant. Record abort or birth before breeding again.');
  }
  if (eventType === 'breeding' && (await cattleHasOpenPregnancy(cattleId))) {
    throw new ApiError(400, 'This animal is already pregnant. Record abort or birth before breeding again.');
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
      ...notDeleted,
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
      ...notDeleted,
    },
    orderBy: { eventDate: 'desc' },
  });
}

export async function resolveGivingBirthDetails(body: Record<string, unknown>): Promise<void> {
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

export async function validateHealthEventCreate(body: Record<string, unknown>): Promise<void> {
  await resolveGivingBirthDetails(body);
  assertRequiredHealthEventDetails(body);
  await assertFemaleCattleForReproductiveEvent(body);
  await assertEligibleCattleForCowReproductiveEvent(body);
  await assertNoInbreedingForHealthEvent(body);
  await assertNoDuplicateOpenPregnancy(body);
  if (typeof body.cattleId === 'string' && body.cattleId) {
    await assertCattleIsActive(body.cattleId);
  }
}

export async function validateHealthEventUpdate(id: string, body: Record<string, unknown>): Promise<void> {
  const existing = await prisma.healthEvent.findUnique({
    where: { id },
    select: { eventType: true, cattleId: true, bullResponsible: true, calfTag: true, calfGender: true, semenUsed: true },
  });
  if (!existing) {
    return;
  }

  const eventType = typeof body.eventType === 'string' ? body.eventType : existing.eventType;
  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : existing.cattleId;
  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible : existing.bullResponsible;
  const calfTag = typeof body.calfTag === 'string' ? body.calfTag : existing.calfTag;
  const calfGender = typeof body.calfGender === 'string' ? body.calfGender : existing.calfGender;
  const semenUsed = typeof body.semenUsed === 'string' ? body.semenUsed : existing.semenUsed;
  assertRequiredHealthEventDetails({ eventType, bullResponsible, calfTag, calfGender, treatmentCost: body.treatmentCost, semenUsed });
  await assertFemaleCattleForReproductiveEvent({ eventType, cattleId });
  await assertEligibleCattleForCowReproductiveEvent({ eventType, cattleId });
  await assertNoInbreedingForHealthEvent({ eventType, cattleId, bullResponsible });
}

export async function syncCattleFromHealthEvent(body: Record<string, unknown>, record: Record<string, unknown>): Promise<void> {
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

export async function syncTreatmentExpense(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  actorUserId?: string | null,
): Promise<void> {
  const eventId = typeof record.id === 'string' ? record.id : null;
  if (!eventId) {
    return;
  }

  const treatmentCost = Number(body.treatmentCost ?? 0);
  const existing = await prisma.transaction.findFirst({
    where: {
      healthEventId: eventId,
      kind: 'EXPENSE',
      category: { equals: 'Veterinary', mode: 'insensitive' },
      ...notDeleted,
    },
  });

  if (treatmentCost <= 0) {
    if (existing) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: actorUserId ? softDeleteData(actorUserId) : { deletedAt: new Date() },
      });
    }
    return;
  }

  const eventType =
    typeof body.eventType === 'string'
      ? body.eventType
      : typeof record.eventType === 'string'
        ? record.eventType
        : 'Treated';
  const medicine =
    typeof body.medicine === 'string'
      ? body.medicine.trim()
      : typeof record.medicine === 'string'
        ? record.medicine.trim()
        : '';
  const semenUsed =
    typeof body.semenUsed === 'string'
      ? body.semenUsed.trim()
      : typeof record.semenUsed === 'string'
        ? record.semenUsed.trim()
        : '';
  const cattleId =
    typeof body.cattleId === 'string'
      ? body.cattleId
      : typeof record.cattleId === 'string'
        ? record.cattleId
        : undefined;
  const farmId =
    typeof body.farmId === 'string' ? body.farmId : typeof record.farmId === 'string' ? record.farmId : undefined;
  const eventDate =
    body.eventDate instanceof Date
      ? body.eventDate
      : record.eventDate instanceof Date
        ? record.eventDate
        : new Date();
  const isAiBreeding = eventType.trim().toLowerCase() === 'breeding' && Boolean(semenUsed);
  const title = isAiBreeding
    ? semenUsed
      ? `Breeding (AI) - ${semenUsed}`
      : 'Breeding (AI)'
    : medicine
      ? `${eventType} - ${medicine}`
      : eventType;

  const payload = {
    farmId,
    cattleId: cattleId || null,
    healthEventId: eventId,
    kind: 'EXPENSE' as const,
    date: eventDate,
    category: 'Veterinary',
    title,
    amount: treatmentCost,
    notes: isAiBreeding ? 'Linked from Breeding (AI) event' : 'Linked from Treated event',
    deletedAt: null,
    deletedByUserId: null,
    ...(actorUserId
      ? {
          updatedByUserId: actorUserId,
          ...(!existing ? { createdByUserId: actorUserId } : {}),
        }
      : {}),
  };

  if (existing) {
    await prisma.transaction.update({ where: { id: existing.id }, data: payload });
    return;
  }

  await prisma.transaction.create({ data: payload });
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

export async function registerCalfFromBirthEvent(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  actorUserId?: string | null,
): Promise<void> {
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

  const mother = await prisma.cattle.findFirst({
    where: { id: cattleId, ...notDeleted },
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
        ...(actorUserId
          ? {
              createdByUserId: actorUserId,
              updatedByUserId: actorUserId,
            }
          : {}),
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

export async function afterHealthEventCreate(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  actorUserId?: string | null,
): Promise<void> {
  await registerCalfFromBirthEvent(body, record, actorUserId);
  await syncCattleFromHealthEvent(body, record);
  await syncTreatmentExpense(body, record, actorUserId);
}

export async function afterHealthEventUpdate(
  _id: string,
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  actorUserId?: string | null,
): Promise<void> {
  await syncCattleFromHealthEvent(body, record);
  await syncTreatmentExpense(body, record, actorUserId);
}

export async function archiveLinkedEventTransactions(eventId: string, actorUserId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: {
      healthEventId: eventId,
      ...notDeleted,
    },
    data: softDeleteData(actorUserId),
  });
}

export async function restoreLinkedEventTransactions(eventId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: {
      healthEventId: eventId,
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      deletedByUserId: null,
    },
  });
}

export async function getLatestBreedingByCattleTag(cattleTag: string) {
  return prisma.healthEvent.findFirst({
    where: {
      scope: 'INDIVIDUAL',
      eventType: { equals: 'Breeding', mode: 'insensitive' },
      cattle: { tagNumber: cattleTag, ...notDeleted },
      ...notDeleted,
    },
    orderBy: { eventDate: 'desc' },
    include: cattleSelect,
  });
}

export async function getBirthPrefillByCattleTag(cattleTag: string) {
  const commonWhere = {
    scope: 'INDIVIDUAL' as const,
    cattle: { tagNumber: cattleTag, ...notDeleted },
    ...notDeleted,
  };

  const pregnancy = await prisma.healthEvent.findFirst({
    where: {
      ...commonWhere,
      eventType: { equals: 'Pregnant', mode: 'insensitive' },
    },
    orderBy: { eventDate: 'desc' },
    include: cattleSelect,
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
    include: cattleSelect,
  });
}

export async function getMilkWithdrawalStatus(cattleTag: string, onDateRaw?: string) {
  const onDate = onDateRaw ? new Date(`${onDateRaw}T00:00:00`) : new Date();
  if (Number.isNaN(onDate.getTime())) {
    throw new ApiError(400, 'onDate must be a valid YYYY-MM-DD date.');
  }
  onDate.setHours(0, 0, 0, 0);

  const events = await prisma.healthEvent.findMany({
    where: {
      scope: 'INDIVIDUAL',
      cattle: { tagNumber: cattleTag, ...notDeleted },
      withdrawalDays: { gt: 0 },
      ...notDeleted,
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

  return {
    cattleTag,
    onDate: onDate.toISOString().slice(0, 10),
    underWithdrawal: Boolean(active),
    active,
  };
}

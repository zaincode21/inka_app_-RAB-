import { prisma } from '../config/prisma.js';
import { ensureDefaultFarm } from './farmService.js';
import { notDeleted, softDeleteData } from '../utils/softDelete.js';

export function withMilkTotal(body: Record<string, unknown>) {
  const amTotal = Number(body.amTotal ?? 0);
  const noonTotal = Number(body.noonTotal ?? 0);
  const pmTotal = Number(body.pmTotal ?? 0);
  const { createMilkSale: _createMilkSale, paymentMethod: _paymentMethod, ...data } = body;
  return {
    ...data,
    totalProduced: body.totalProduced ?? amTotal + noonTotal + pmTotal,
  };
}

function soldMilkLiters(record: Record<string, unknown>): number {
  const produced = Number(record.totalProduced ?? 0);
  const used = Number(record.totalUsed ?? 0);
  const calfMilk = Number(record.calfMilk ?? 0);
  const rejected = Number(record.rejectedMilk ?? 0);
  return Math.max(0, Number((produced - used - calfMilk - rejected).toFixed(2)));
}

export async function syncMilkSaleIncome(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  _isCreate: boolean,
  actorUserId?: string | null,
): Promise<void> {
  const milkRecordId = typeof record.id === 'string' ? record.id : null;
  if (!milkRecordId) {
    return;
  }

  const milkType = String(body.milkType ?? record.milkType ?? '')
    .trim()
    .toLowerCase();
  const isWholeFarm = milkType === 'whole farm';
  const createRequested = body.createMilkSale === true;
  const merged = { ...record, ...body };
  const soldLiters = soldMilkLiters(merged);
  const unitPrice = Number(merged.pricePerLiter ?? 0);
  const amount = Number((soldLiters * unitPrice).toFixed(2));

  const existing = await prisma.transaction.findFirst({
    where: {
      milkRecordId,
      kind: 'INCOME',
      category: { equals: 'Milk Sale', mode: 'insensitive' },
      ...notDeleted,
    },
  });

  if (!isWholeFarm || soldLiters <= 0 || unitPrice <= 0) {
    if (existing && actorUserId) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: softDeleteData(actorUserId),
      });
    } else if (existing) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }
    return;
  }

  if (!existing && !createRequested) {
    return;
  }

  const farmId = typeof record.farmId === 'string' ? record.farmId : null;
  const farm = farmId
    ? await prisma.farm.findUnique({ where: { id: farmId } })
    : await ensureDefaultFarm();
  if (!farm) {
    return;
  }
  const eventDate =
    body.date instanceof Date ? body.date : record.date instanceof Date ? record.date : new Date();
  const buyer =
    (typeof body.buyer === 'string' && body.buyer.trim()) || farm.defaultMilkBuyer?.trim() || '';
  const paymentMethod =
    (typeof body.paymentMethod === 'string' && body.paymentMethod.trim()) || 'Cash';
  const destination =
    (typeof body.destination === 'string' && body.destination.trim()) ||
    farm.defaultMilkDestination?.trim() ||
    '';

  const payload = {
    farmId: farmId ?? farm.id,
    milkRecordId,
    kind: 'INCOME' as const,
    date: eventDate,
    category: 'Milk Sale',
    title: destination ? `Milk Sale — ${destination}` : 'Milk Sale',
    amount,
    quantity: soldLiters,
    unitPrice,
    paymentMethod,
    buyerVendor: buyer || null,
    notes: `Linked milk sale: ${soldLiters} L × ${unitPrice}.`,
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

function toMoney(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const decimal = value as { toNumber: () => number };
    if (typeof decimal.toNumber === 'function') {
      return Number(decimal.toNumber()) || 0;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function syncCalfMilkExpense(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  actorUserId?: string | null,
): Promise<void> {
  const milkRecordId = typeof record.id === 'string' ? record.id : null;
  if (!milkRecordId) {
    return;
  }

  const merged = { ...record, ...body };
  const calfLiters = toMoney(merged.calfMilk);

  const existing = await prisma.transaction.findFirst({
    where: {
      milkRecordId,
      kind: 'EXPENSE',
      category: { equals: 'Calf Milk', mode: 'insensitive' },
      ...notDeleted,
    },
  });

  const farmId = typeof record.farmId === 'string' ? record.farmId : null;
  const farm = farmId
    ? await prisma.farm.findUnique({ where: { id: farmId } })
    : await ensureDefaultFarm();
  if (!farm) {
    return;
  }

  const recordPrice = toMoney(merged.pricePerLiter);
  const farmPrice = toMoney(farm.milkPricePerLiter);
  const unitPrice = recordPrice > 0 ? recordPrice : farmPrice;
  const amount = Number((calfLiters * unitPrice).toFixed(2));

  if (calfLiters <= 0 || unitPrice <= 0) {
    if (existing && actorUserId) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: softDeleteData(actorUserId),
      });
    } else if (existing) {
      await prisma.transaction.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }
    return;
  }

  if (recordPrice <= 0 && farmPrice > 0) {
    await prisma.milkRecord.update({
      where: { id: milkRecordId },
      data: { pricePerLiter: farmPrice },
    });
  }

  const eventDate =
    body.date instanceof Date ? body.date : record.date instanceof Date ? record.date : new Date();
  const cattleId =
    typeof merged.cattleId === 'string' && merged.cattleId.trim() ? merged.cattleId : null;

  const payload = {
    farmId: farmId ?? farm.id,
    milkRecordId,
    cattleId,
    kind: 'EXPENSE' as const,
    date: eventDate,
    category: 'Calf Milk',
    title: 'Calf Milk',
    amount,
    quantity: calfLiters,
    unitPrice,
    notes: `Linked calf milk: ${calfLiters} L × ${unitPrice}.`,
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

export async function deleteLinkedMilkSales(milkRecordId: string, actorUserId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: {
      milkRecordId,
      kind: 'INCOME',
      category: { equals: 'Milk Sale', mode: 'insensitive' },
      ...notDeleted,
    },
    data: softDeleteData(actorUserId),
  });
  await prisma.transaction.updateMany({
    where: {
      milkRecordId,
      kind: 'EXPENSE',
      category: { equals: 'Calf Milk', mode: 'insensitive' },
      ...notDeleted,
    },
    data: softDeleteData(actorUserId),
  });
}

export async function restoreLinkedMilkSales(milkRecordId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: {
      milkRecordId,
      kind: 'INCOME',
      category: { equals: 'Milk Sale', mode: 'insensitive' },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      deletedByUserId: null,
    },
  });
  await prisma.transaction.updateMany({
    where: {
      milkRecordId,
      kind: 'EXPENSE',
      category: { equals: 'Calf Milk', mode: 'insensitive' },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      deletedByUserId: null,
    },
  });
}

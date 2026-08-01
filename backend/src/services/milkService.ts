import { prisma } from '../config/prisma.js';
import { ensureDefaultFarm } from './farmService.js';

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
  const rejected = Number(record.rejectedMilk ?? 0);
  return Math.max(0, Number((produced - used - rejected).toFixed(2)));
}

export async function syncMilkSaleIncome(
  body: Record<string, unknown>,
  record: Record<string, unknown>,
  _isCreate: boolean,
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
    },
  });

  if (!isWholeFarm || soldLiters <= 0 || unitPrice <= 0) {
    if (existing) {
      await prisma.transaction.delete({ where: { id: existing.id } });
    }
    return;
  }

  if (!existing && !createRequested) {
    return;
  }

  const farm = await ensureDefaultFarm();
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
    farmId: typeof record.farmId === 'string' ? record.farmId : farm.id,
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
  };

  if (existing) {
    await prisma.transaction.update({ where: { id: existing.id }, data: payload });
    return;
  }

  await prisma.transaction.create({ data: payload });
}

export async function deleteLinkedMilkSales(milkRecordId: string): Promise<void> {
  await prisma.transaction.deleteMany({
    where: {
      milkRecordId,
      kind: 'INCOME',
      category: { equals: 'Milk Sale', mode: 'insensitive' },
    },
  });
}

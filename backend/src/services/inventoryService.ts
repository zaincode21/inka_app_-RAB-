import { prisma } from '../config/prisma.js';
import { ApiError, notFound } from '../utils/apiError.js';
import { canWriteInventory, isSuperAdmin, type AuthUser } from '../utils/permissions.js';
import { resolveFarmIdForRequest } from './farmService.js';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

export function mapInventoryItem(row: {
  id: string;
  farmId: string | null;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: unknown;
  reorderLevel: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const quantityOnHand = toNumber(row.quantityOnHand);
  const reorderLevel = toNumber(row.reorderLevel);
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    category: row.category,
    unit: row.unit,
    quantityOnHand,
    reorderLevel,
    notes: row.notes,
    lowStock: reorderLevel > 0 && quantityOnHand <= reorderLevel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listInventoryItems(auth: AuthUser, requestedFarmId?: string) {
  const farmId = await resolveFarmIdForRequest(auth, requestedFarmId);
  const rows = await prisma.inventoryItem.findMany({
    where: { farmId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return rows.map(mapInventoryItem);
}

export async function createInventoryItem(
  auth: AuthUser,
  input: {
    name: string;
    category?: string;
    unit?: string;
    quantityOnHand?: number;
    reorderLevel?: number;
    notes?: string;
  },
) {
  if (!canWriteInventory(auth)) {
    throw new ApiError(403, 'You do not have permission to manage inventory.');
  }
  const farmId = await resolveFarmIdForRequest(auth);
  const name = input.name.trim();
  if (!name) {
    throw new ApiError(400, 'Item name is required.');
  }

  try {
    const row = await prisma.inventoryItem.create({
      data: {
        farmId,
        name,
        category: (input.category?.trim() || 'Feed').trim(),
        unit: (input.unit?.trim() || 'kg').trim(),
        quantityOnHand: input.quantityOnHand ?? 0,
        reorderLevel: input.reorderLevel ?? 0,
        notes: input.notes?.trim() || null,
      },
    });
    return mapInventoryItem(row);
  } catch {
    throw new ApiError(409, 'An inventory item with this name already exists on the farm.');
  }
}

export async function updateInventoryItem(
  auth: AuthUser,
  id: string,
  input: {
    name?: string;
    category?: string;
    unit?: string;
    reorderLevel?: number;
    notes?: string;
  },
) {
  if (!canWriteInventory(auth)) {
    throw new ApiError(403, 'You do not have permission to manage inventory.');
  }
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Inventory item');
  }
  assertItemFarmAccess(auth, existing.farmId);

  try {
    const row = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category.trim() || 'Feed' } : {}),
        ...(input.unit !== undefined ? { unit: input.unit.trim() || 'kg' } : {}),
        ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      },
    });
    return mapInventoryItem(row);
  } catch {
    throw new ApiError(409, 'An inventory item with this name already exists on the farm.');
  }
}

export async function receiveInventory(
  auth: AuthUser,
  itemId: string,
  input: {
    quantity: number;
    unitCost?: number;
    date: Date;
    notes?: string;
    createExpense?: boolean;
    vendor?: string;
  },
) {
  if (!canWriteInventory(auth)) {
    throw new ApiError(403, 'You do not have permission to manage inventory.');
  }
  if (!(input.quantity > 0)) {
    throw new ApiError(400, 'Quantity must be greater than zero.');
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw notFound('Inventory item');
  }
  assertItemFarmAccess(auth, item.farmId);
  const farmId = item.farmId;
  if (!farmId) {
    throw new ApiError(400, 'Inventory item is not linked to a farm.');
  }

  const unitCost = Number(input.unitCost ?? 0);
  const totalCost = Number((input.quantity * unitCost).toFixed(2));
  const createExpense = Boolean(input.createExpense) && totalCost > 0;

  const result = await prisma.$transaction(async (tx) => {
    let transactionId: string | null = null;
    if (createExpense) {
      const expense = await tx.transaction.create({
        data: {
          farmId,
          kind: 'EXPENSE',
          date: input.date,
          category: 'Feed',
          title: `Feed purchase — ${item.name}`,
          amount: totalCost,
          quantity: input.quantity,
          unitPrice: unitCost,
          buyerVendor: input.vendor?.trim() || null,
          notes: input.notes?.trim() || `Inventory receive for ${item.name}`,
          createdByUserId: auth.id,
          updatedByUserId: auth.id,
        },
      });
      transactionId = expense.id;
    }

    const movement = await tx.inventoryMovement.create({
      data: {
        farmId,
        itemId: item.id,
        kind: 'IN',
        quantity: input.quantity,
        unitCost,
        totalCost,
        date: input.date,
        notes: input.notes?.trim() || null,
        transactionId,
        createdByUserId: auth.id,
      },
    });

    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantityOnHand: { increment: input.quantity },
      },
    });

    return { item: updated, movement };
  });

  return {
    item: mapInventoryItem(result.item),
    movement: mapMovement(result.movement),
  };
}

export async function useInventory(
  auth: AuthUser,
  itemId: string,
  input: { quantity: number; date: Date; notes?: string },
) {
  if (!canWriteInventory(auth)) {
    throw new ApiError(403, 'You do not have permission to manage inventory.');
  }
  if (!(input.quantity > 0)) {
    throw new ApiError(400, 'Quantity must be greater than zero.');
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw notFound('Inventory item');
  }
  assertItemFarmAccess(auth, item.farmId);

  const onHand = toNumber(item.quantityOnHand);
  if (input.quantity > onHand + 0.0001) {
    throw new ApiError(400, `Only ${onHand} ${item.unit} available.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.inventoryMovement.create({
      data: {
        farmId: item.farmId,
        itemId: item.id,
        kind: 'OUT',
        quantity: input.quantity,
        unitCost: 0,
        totalCost: 0,
        date: input.date,
        notes: input.notes?.trim() || null,
        createdByUserId: auth.id,
      },
    });
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantityOnHand: { decrement: input.quantity },
      },
    });
    return { item: updated, movement };
  });

  return {
    item: mapInventoryItem(result.item),
    movement: mapMovement(result.movement),
  };
}

export async function listInventoryMovements(auth: AuthUser, itemId: string) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw notFound('Inventory item');
  }
  assertItemFarmAccess(auth, item.farmId);
  const rows = await prisma.inventoryMovement.findMany({
    where: { itemId },
    orderBy: { date: 'desc' },
    take: 50,
  });
  return rows.map(mapMovement);
}

function mapMovement(row: {
  id: string;
  farmId: string | null;
  itemId: string;
  kind: string;
  quantity: unknown;
  unitCost: unknown;
  totalCost: unknown;
  date: Date;
  notes: string | null;
  transactionId: string | null;
  createdByUserId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    farmId: row.farmId,
    itemId: row.itemId,
    kind: row.kind,
    quantity: toNumber(row.quantity),
    unitCost: toNumber(row.unitCost),
    totalCost: toNumber(row.totalCost),
    date: row.date,
    notes: row.notes,
    transactionId: row.transactionId,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
  };
}

function assertItemFarmAccess(auth: AuthUser, farmId: string | null) {
  if (isSuperAdmin(auth)) {
    return;
  }
  if (!auth.farmId || !farmId || auth.farmId !== farmId) {
    throw notFound('Inventory item');
  }
}

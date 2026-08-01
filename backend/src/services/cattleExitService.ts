import { prisma } from '../config/prisma.js';
import { ApiError, notFound } from '../utils/apiError.js';
import { notDeleted } from '../utils/softDelete.js';
import { writeAudit } from './auditService.js';
import type { AuthUser } from '../utils/permissions.js';

const exitStatuses = new Set(['SOLD', 'CULLED', 'DEAD', 'INACTIVE']);

export async function assertCattleIsActive(cattleId: string | null | undefined): Promise<void> {
  if (!cattleId) {
    return;
  }

  const cattle = await prisma.cattle.findFirst({
    where: { id: cattleId, ...notDeleted },
    select: { status: true, tagNumber: true },
  });

  if (!cattle) {
    throw new ApiError(400, 'Linked cattle was not found.');
  }

  if (cattle.status !== 'ACTIVE') {
    throw new ApiError(400, `Cattle ${cattle.tagNumber} is ${cattle.status.toLowerCase()} and cannot receive new milk or event records.`);
  }
}

export async function exitCattle(
  cattleId: string,
  body: {
    status: 'SOLD' | 'CULLED' | 'DEAD' | 'INACTIVE';
    exitDate: Date;
    reason?: string | null;
    amount?: number;
    buyerVendor?: string | null;
    paymentMethod?: string | null;
  },
  auth: AuthUser,
) {
  if (!exitStatuses.has(body.status)) {
    throw new ApiError(400, 'Exit status must be SOLD, CULLED, DEAD, or INACTIVE.');
  }

  const cattle = await prisma.cattle.findFirst({
    where: { id: cattleId, ...notDeleted },
  });
  if (!cattle) {
    throw notFound('Cattle');
  }
  if (!auth.farmId || cattle.farmId !== auth.farmId) {
    if (auth.role !== 'SUPER_ADMIN') {
      throw notFound('Cattle');
    }
  }
  if (cattle.status !== 'ACTIVE') {
    throw new ApiError(400, `Cattle is already ${cattle.status.toLowerCase()}.`);
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const amount = Number(body.amount ?? 0);
  const buyerVendor = typeof body.buyerVendor === 'string' ? body.buyerVendor.trim() : '';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : 'Cash';
  const exitDateIso = body.exitDate.toISOString().slice(0, 10);
  const exitNote = [
    `Exit: ${body.status} on ${exitDateIso}`,
    reason ? `Reason: ${reason}` : '',
  ]
    .filter(Boolean)
    .join('. ');

  const notes = [cattle.notes?.trim(), exitNote].filter(Boolean).join('\n');

  const updated = await prisma.cattle.update({
    where: { id: cattle.id },
    data: {
      status: body.status,
      notes: notes || null,
      updatedByUserId: auth.id,
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  let transactionId: string | null = null;
  if (amount > 0 && (body.status === 'SOLD' || body.status === 'CULLED' || body.status === 'DEAD')) {
    const isSale = body.status === 'SOLD';
    const created = await prisma.transaction.create({
      data: {
        farmId: cattle.farmId,
        cattleId: cattle.id,
        kind: isSale ? 'INCOME' : 'EXPENSE',
        date: body.exitDate,
        category: isSale ? 'Cattle Sale' : 'Cattle Disposal',
        title: isSale
          ? `Cattle sale — ${cattle.tagNumber}`
          : `${body.status === 'CULLED' ? 'Cull' : 'Disposal'} — ${cattle.tagNumber}`,
        amount,
        quantity: 1,
        unitPrice: amount,
        paymentMethod: paymentMethod || 'Cash',
        buyerVendor: buyerVendor || null,
        notes: reason || exitNote,
        createdByUserId: auth.id,
        updatedByUserId: auth.id,
      },
    });
    transactionId = created.id;

    await writeAudit({
      auth,
      farmId: cattle.farmId,
      action: 'CREATE',
      entityType: 'Transaction',
      entityId: created.id,
      summary: isSale
        ? `Created Cattle Sale for ${cattle.tagNumber}`
        : `Created Cattle Disposal expense for ${cattle.tagNumber}`,
    });
  }

  await writeAudit({
    auth,
    farmId: cattle.farmId,
    action: 'UPDATE',
    entityType: 'Cattle',
    entityId: cattle.id,
    summary: `Recorded cattle exit (${body.status}) for ${cattle.tagNumber}`,
    metadata: { status: body.status, transactionId },
  });

  return { cattle: updated, transactionId };
}

import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { resolveFarmIdForRequest } from '../services/farmService.js';
import { notDeleted } from '../utils/softDelete.js';
import { ApiError } from '../utils/apiError.js';
import { canViewFinance } from '../utils/permissions.js';

export const reportRouter = Router();

reportRouter.get(
  '/dashboard',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [calves, cows, bulls, milkToday, healthAlerts, incomeThisMonth, expensesThisMonth] = await Promise.all([
      prisma.cattle.count({ where: { farmId, stage: 'CALF', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.cattle.count({ where: { farmId, stage: { in: ['COW', 'HEIFER'] }, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.cattle.count({ where: { farmId, stage: 'BULL', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.milkRecord.aggregate({ where: { farmId, date: { gte: today, lt: tomorrow }, ...notDeleted }, _sum: { totalProduced: true } }),
      prisma.healthEvent.count({ where: { farmId, followUpDate: { lte: today }, ...notDeleted } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'INCOME', date: { gte: monthStart, lt: nextMonth }, ...notDeleted }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'EXPENSE', date: { gte: monthStart, lt: nextMonth }, ...notDeleted }, _sum: { amount: true } }),
    ]);

    response.json({
      calves,
      cows,
      bulls,
      totalMilkToday: Number(milkToday._sum.totalProduced ?? 0),
      healthAlerts,
      incomeThisMonth: Number(incomeThisMonth._sum.amount ?? 0),
      expensesThisMonth: Number(expensesThisMonth._sum.amount ?? 0),
    });
  }),
);

reportRouter.get(
  '/summaries',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);

    const [cattleTotal, milkTotal, eventTotal, breedingTotal, pregnantTotal, incomeTotal, expenseTotal, latestWeight] = await Promise.all([
      prisma.cattle.count({ where: { farmId, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.milkRecord.aggregate({ where: { farmId, ...notDeleted }, _sum: { totalProduced: true } }),
      prisma.healthEvent.count({ where: { farmId, ...notDeleted } }),
      prisma.healthEvent.count({ where: { farmId, eventType: { equals: 'Breeding', mode: 'insensitive' }, ...notDeleted } }),
      prisma.healthEvent.count({ where: { farmId, eventType: { equals: 'Pregnant', mode: 'insensitive' }, ...notDeleted } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'INCOME', ...notDeleted }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'EXPENSE', ...notDeleted }, _sum: { amount: true } }),
      prisma.cattle.findFirst({ where: { farmId, weightKg: { gt: 0 }, ...notDeleted }, orderBy: { updatedAt: 'desc' }, select: { weightKg: true } }),
    ]);

    const income = Number(incomeTotal._sum.amount ?? 0);
    const expenses = Number(expenseTotal._sum.amount ?? 0);

    response.json([
      { id: 'transactions', label: 'Transactions', value: income - expenses, detail: `${income} income / ${expenses} expense` },
      { id: 'milk', label: 'Milk Records', value: Number(milkTotal._sum.totalProduced ?? 0), detail: 'Total milk produced' },
      { id: 'cattle', label: 'Cattle', value: cattleTotal, detail: 'Active animals in herd' },
      { id: 'events', label: 'Events', value: eventTotal, detail: 'Veterinary and herd events' },
      { id: 'breeding', label: 'Breeding', value: breedingTotal, detail: 'Recorded breeding services' },
      { id: 'pregnancies', label: 'Pregnancies', value: pregnantTotal, detail: 'Pregnancy confirmations' },
      { id: 'weight', label: 'Weight', value: Number(latestWeight?.weightKg ?? 0), detail: 'Latest recorded cattle weight' },
      { id: 'stages', label: 'Stage Tracking', value: cattleTotal, detail: 'Animals with lifecycle stage data' },
    ]);
  }),
);

reportRouter.get(
  '/period',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const { from, toExclusive } = parseDateRange(request.query.from, request.query.to);
    const includeFinance = canViewFinance(auth);

    const milkWhere = { farmId, date: { gte: from, lt: toExclusive }, ...notDeleted };
    const eventWhere = { farmId, eventDate: { gte: from, lt: toExclusive }, ...notDeleted };
    const txWhere = { farmId, date: { gte: from, lt: toExclusive }, ...notDeleted };

    const [milkAgg, eventTotal, activeCattle, exitedCattle, incomeAgg, expenseAgg, incomeRows, expenseRows] =
      await Promise.all([
        prisma.milkRecord.aggregate({
          where: milkWhere,
          _sum: { totalProduced: true, totalUsed: true, rejectedMilk: true },
          _count: true,
        }),
        prisma.healthEvent.count({ where: eventWhere }),
        prisma.cattle.count({
          where: { farmId, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted },
        }),
        prisma.cattle.count({
          where: { farmId, status: { in: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted },
        }),
        includeFinance
          ? prisma.transaction.aggregate({ where: { ...txWhere, kind: 'INCOME' }, _sum: { amount: true } })
          : Promise.resolve({ _sum: { amount: null } }),
        includeFinance
          ? prisma.transaction.aggregate({ where: { ...txWhere, kind: 'EXPENSE' }, _sum: { amount: true } })
          : Promise.resolve({ _sum: { amount: null } }),
        includeFinance
          ? prisma.transaction.groupBy({
              by: ['category'],
              where: { ...txWhere, kind: 'INCOME' },
              _sum: { amount: true },
              orderBy: { _sum: { amount: 'desc' } },
            })
          : Promise.resolve([]),
        includeFinance
          ? prisma.transaction.groupBy({
              by: ['category'],
              where: { ...txWhere, kind: 'EXPENSE' },
              _sum: { amount: true },
              orderBy: { _sum: { amount: 'desc' } },
            })
          : Promise.resolve([]),
      ]);

    const produced = Number(milkAgg._sum.totalProduced ?? 0);
    const used = Number(milkAgg._sum.totalUsed ?? 0);
    const rejected = Number(milkAgg._sum.rejectedMilk ?? 0);
    const income = includeFinance ? Number(incomeAgg._sum.amount ?? 0) : 0;
    const expenses = includeFinance ? Number(expenseAgg._sum.amount ?? 0) : 0;

    response.json({
      from: isoDate(from),
      to: isoDate(addDays(toExclusive, -1)),
      milk: {
        records: milkAgg._count,
        produced,
        used,
        rejected,
        soldEstimate: Math.max(0, Number((produced - used - rejected).toFixed(2))),
      },
      herd: {
        active: activeCattle,
        exited: exitedCattle,
      },
      events: {
        total: eventTotal,
      },
      finance: includeFinance
        ? {
            income,
            expenses,
            net: Number((income - expenses).toFixed(2)),
            incomeByCategory: incomeRows.map((row) => ({
              category: row.category,
              amount: Number(row._sum.amount ?? 0),
            })),
            expenseByCategory: expenseRows.map((row) => ({
              category: row.category,
              amount: Number(row._sum.amount ?? 0),
            })),
          }
        : null,
    });
  }),
);

reportRouter.get(
  '/export.csv',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const dataset = String(request.query.dataset ?? 'milk').toLowerCase();
    const { from, toExclusive } = parseDateRange(request.query.from, request.query.to);

    let csv = '';
    let filename = `inka-${dataset}-${isoDate(from)}-${isoDate(addDays(toExclusive, -1))}.csv`;

    if (dataset === 'milk') {
      const rows = await prisma.milkRecord.findMany({
        where: { farmId, date: { gte: from, lt: toExclusive }, ...notDeleted },
        orderBy: { date: 'asc' },
        include: { cattle: { select: { tagNumber: true, name: true } } },
      });
      csv = toCsv(
        [
          'date',
          'milkType',
          'cattleTag',
          'cattleName',
          'amTotal',
          'noonTotal',
          'pmTotal',
          'totalProduced',
          'totalUsed',
          'rejectedMilk',
          'destination',
          'buyer',
          'pricePerLiter',
          'fatPercent',
          'proteinPercent',
          'somaticCellCount',
          'notes',
        ],
        rows.map((row) => [
          isoDate(row.date),
          row.milkType,
          row.cattle?.tagNumber ?? '',
          row.cattle?.name ?? '',
          Number(row.amTotal),
          Number(row.noonTotal),
          Number(row.pmTotal),
          Number(row.totalProduced),
          Number(row.totalUsed),
          Number(row.rejectedMilk),
          row.destination ?? '',
          row.buyer ?? '',
          Number(row.pricePerLiter),
          Number(row.fatPercent),
          Number(row.proteinPercent),
          Number(row.somaticCellCount),
          row.notes ?? '',
        ]),
      );
    } else if (dataset === 'transactions') {
      if (!canViewFinance(auth)) {
        throw new ApiError(403, 'You do not have permission to export financial records.');
      }
      const rows = await prisma.transaction.findMany({
        where: { farmId, date: { gte: from, lt: toExclusive }, ...notDeleted },
        orderBy: { date: 'asc' },
      });
      csv = toCsv(
        [
          'date',
          'kind',
          'category',
          'title',
          'amount',
          'quantity',
          'unitPrice',
          'paymentMethod',
          'buyerVendor',
          'receiptNumber',
          'notes',
        ],
        rows.map((row) => [
          isoDate(row.date),
          row.kind,
          row.category,
          row.title,
          Number(row.amount),
          Number(row.quantity),
          Number(row.unitPrice),
          row.paymentMethod ?? '',
          row.buyerVendor ?? '',
          row.receiptNumber ?? '',
          row.notes ?? '',
        ]),
      );
    } else if (dataset === 'events') {
      const rows = await prisma.healthEvent.findMany({
        where: { farmId, eventDate: { gte: from, lt: toExclusive }, ...notDeleted },
        orderBy: { eventDate: 'asc' },
        include: { cattle: { select: { tagNumber: true } } },
      });
      csv = toCsv(
        [
          'eventDate',
          'scope',
          'eventType',
          'cattleTag',
          'groupName',
          'medicine',
          'diagnosis',
          'withdrawalDays',
          'followUpDate',
          'technician',
          'notes',
        ],
        rows.map((row) => [
          isoDate(row.eventDate),
          row.scope,
          row.eventType,
          row.cattle?.tagNumber ?? '',
          row.groupName ?? '',
          row.medicine ?? '',
          row.diagnosis ?? '',
          Number(row.withdrawalDays ?? 0),
          row.followUpDate ? isoDate(row.followUpDate) : '',
          row.technician ?? '',
          row.notes ?? '',
        ]),
      );
    } else if (dataset === 'cattle') {
      const rows = await prisma.cattle.findMany({
        where: { farmId, ...notDeleted },
        orderBy: { tagNumber: 'asc' },
      });
      filename = `inka-cattle-${isoDate(new Date())}.csv`;
      csv = toCsv(
        [
          'tagNumber',
          'name',
          'breed',
          'sex',
          'stage',
          'status',
          'dateOfBirth',
          'entryDate',
          'weightKg',
          'paddock',
          'motherTag',
          'fatherTag',
          'notes',
        ],
        rows.map((row) => [
          row.tagNumber,
          row.name ?? '',
          row.breed ?? '',
          row.sex,
          row.stage,
          row.status,
          row.dateOfBirth ? isoDate(row.dateOfBirth) : '',
          row.entryDate ? isoDate(row.entryDate) : '',
          Number(row.weightKg ?? 0),
          row.paddock ?? '',
          row.motherTag ?? '',
          row.fatherTag ?? '',
          row.notes ?? '',
        ]),
      );
    } else {
      throw new ApiError(400, 'dataset must be milk, transactions, events, or cattle.');
    }

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.send(csv);
  }),
);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateQuery(value: unknown, fallback: Date): Date {
  if (typeof value !== 'string' || !value.trim()) {
    return startOfDay(fallback);
  }
  const parsed = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, 'Invalid date. Use YYYY-MM-DD.');
  }
  return startOfDay(parsed);
}

function parseDateRange(fromRaw: unknown, toRaw: unknown) {
  const today = startOfDay(new Date());
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const from = parseDateQuery(fromRaw, defaultFrom);
  const toInclusive = parseDateQuery(toRaw, today);
  if (toInclusive < from) {
    throw new ApiError(400, '`to` must be on or after `from`.');
  }
  const toExclusive = addDays(toInclusive, 1);
  return { from, toExclusive };
}

function csvEscape(value: string | number) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

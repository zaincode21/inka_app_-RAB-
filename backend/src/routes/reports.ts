import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { resolveFarmIdForRequest } from '../services/farmService.js';
import { renderFarmReportPdf } from '../services/jsreportService.js';
import { notDeleted } from '../utils/softDelete.js';
import { ApiError } from '../utils/apiError.js';
import { canViewFinance } from '../utils/permissions.js';
import {
  addDays,
  isoDate,
  parseDateRange,
  toCsvWithFarmHeader,
  type FarmReportInfo,
} from '../utils/reportExport.js';

export const reportRouter = Router();

async function loadFarmReportInfo(farmId: string): Promise<FarmReportInfo> {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: {
      name: true,
      ownerName: true,
      ownerPhone: true,
      location: true,
      district: true,
      sector: true,
      currency: true,
    },
  });
  if (!farm) {
    throw new ApiError(404, 'Farm not found.');
  }
  return farm;
}

type ExportBundle = {
  filenameBase: string;
  reportTitle: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  columns: Array<{ key: string; label: string }>;
  objectRows: Array<Record<string, string | number>>;
  summaryLines?: Array<{ label: string; value: string }>;
};

type EventReportSource = {
  scope: string;
  groupName: string | null;
  eventDate: Date;
  eventType: string;
  symptoms: string | null;
  diagnosis: string | null;
  medicine: string | null;
  withdrawalDays: unknown;
  followUpDate: Date | null;
  technician: string | null;
  vetName: string | null;
  semenUsed: string | null;
  bullResponsible: string | null;
  returnHeatDate: Date | null;
  breedingDate: Date | null;
  expectedDeliveryDate: Date | null;
  calfTag: string | null;
  calfGender: string | null;
  notes: string | null;
  cattle: { tagNumber: string } | null;
};

const EVENT_COLUMN_ORDER = [
  'eventDate',
  'eventType',
  'cattleTag',
  'scope',
  'groupName',
  'breedingType',
  'bullTag',
  'semenUsed',
  'inseminator',
  'breedingDate',
  'returnHeatDate',
  'expectedDeliveryDate',
  'calfTag',
  'calfGender',
  'symptoms',
  'medicine',
  'diagnosis',
  'withdrawalDays',
  'followUpDate',
  'technician',
  'notes',
] as const;

const EVENT_COLUMN_LABELS: Record<string, string> = {
  eventDate: 'Date',
  eventType: 'Event',
  cattleTag: 'Animal',
  scope: 'Scope',
  groupName: 'Group',
  breedingType: 'Breeding Type',
  bullTag: 'Bull Tag',
  semenUsed: 'Semen',
  inseminator: 'Inseminator',
  breedingDate: 'Service Date',
  returnHeatDate: 'Return Heat',
  expectedDeliveryDate: 'Delivery Date',
  calfTag: 'Calf Name',
  calfGender: 'Calf Gender',
  symptoms: 'Symptoms',
  medicine: 'Medicine',
  diagnosis: 'Diagnosis',
  withdrawalDays: 'Withdrawal Days',
  followUpDate: 'Follow-up',
  technician: 'Technician',
  notes: 'Notes',
};

function isBlankReportValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return Number.isNaN(value);
  return !String(value).trim();
}

function putIfPresent(target: Record<string, string | number>, key: string, value: string | number | null | undefined) {
  if (isBlankReportValue(value)) return;
  target[key] = typeof value === 'number' ? value : String(value).trim();
}

function inferBreedingType(semen: string, bull: string, vet: string): string {
  if (semen || vet) return 'Gutera intanga (semen)';
  if (bull) return 'Ikimasa (bull)';
  return '';
}

function buildEventReportRow(row: EventReportSource): Record<string, string | number> {
  const type = row.eventType.trim().toLowerCase();
  const semen = row.semenUsed?.trim() || '';
  const bull = row.bullResponsible?.trim() || '';
  const vet = row.vetName?.trim() || '';
  const out: Record<string, string | number> = {};

  putIfPresent(out, 'eventDate', isoDate(row.eventDate));
  putIfPresent(out, 'eventType', row.eventType);
  putIfPresent(out, 'cattleTag', row.cattle?.tagNumber ?? '');

  // Breeding (Kwimisha), Pregnant (Gusama), Aborted (Kuramburura), Giving Birth (Kubyara):
  // only necessary reproductive fields — never dump medication columns.
  if (type === 'breeding') {
    putIfPresent(out, 'breedingType', inferBreedingType(semen, bull, vet));
    putIfPresent(out, 'bullTag', bull);
    putIfPresent(out, 'semenUsed', semen);
    putIfPresent(out, 'inseminator', vet);
    putIfPresent(out, 'returnHeatDate', row.returnHeatDate ? isoDate(row.returnHeatDate) : '');
    putIfPresent(out, 'notes', row.notes ?? '');
    return out;
  }

  if (type === 'pregnant' || type === 'pregnancy diagnosis') {
    putIfPresent(out, 'breedingType', inferBreedingType(semen, bull, vet));
    putIfPresent(out, 'bullTag', bull);
    putIfPresent(out, 'semenUsed', semen);
    putIfPresent(out, 'inseminator', vet);
    putIfPresent(out, 'breedingDate', row.breedingDate ? isoDate(row.breedingDate) : isoDate(row.eventDate));
    putIfPresent(out, 'expectedDeliveryDate', row.expectedDeliveryDate ? isoDate(row.expectedDeliveryDate) : '');
    if (type === 'pregnancy diagnosis') {
      putIfPresent(out, 'diagnosis', row.diagnosis ?? '');
    }
    putIfPresent(out, 'notes', row.notes ?? '');
    return out;
  }

  if (type === 'aborted') {
    putIfPresent(out, 'bullTag', bull);
    putIfPresent(out, 'breedingDate', row.breedingDate ? isoDate(row.breedingDate) : '');
    putIfPresent(out, 'notes', row.notes ?? '');
    return out;
  }

  if (type === 'giving birth') {
    putIfPresent(out, 'bullTag', bull);
    putIfPresent(out, 'calfTag', row.calfTag ?? '');
    putIfPresent(out, 'calfGender', row.calfGender ?? '');
    putIfPresent(out, 'notes', row.notes ?? '');
    return out;
  }

  putIfPresent(out, 'scope', row.scope);
  putIfPresent(out, 'groupName', row.groupName ?? '');
  putIfPresent(out, 'symptoms', row.symptoms ?? '');
  putIfPresent(out, 'medicine', row.medicine ?? '');
  putIfPresent(out, 'diagnosis', row.diagnosis ?? '');
  const withdrawal = Number(row.withdrawalDays ?? 0);
  if (withdrawal > 0) {
    out.withdrawalDays = withdrawal;
  }
  putIfPresent(out, 'followUpDate', row.followUpDate ? isoDate(row.followUpDate) : '');
  putIfPresent(out, 'technician', row.technician ?? '');
  putIfPresent(out, 'inseminator', vet);
  putIfPresent(out, 'notes', row.notes ?? '');
  return out;
}

function pruneEmptyReportColumns(
  objectRows: Array<Record<string, string | number>>,
  preferredOrder: readonly string[],
  labels: Record<string, string>,
) {
  const presentKeys = new Set<string>();
  for (const row of objectRows) {
    for (const [key, value] of Object.entries(row)) {
      if (!isBlankReportValue(value)) {
        presentKeys.add(key);
      }
    }
  }

  const headers = [
    ...preferredOrder.filter((key) => presentKeys.has(key)),
    ...[...presentKeys].filter((key) => !preferredOrder.includes(key)).sort(),
  ];

  const prunedRows = objectRows.map((row) => {
    const pruned: Record<string, string | number> = {};
    for (const key of headers) {
      const value = row[key];
      pruned[key] = isBlankReportValue(value) ? '' : (value as string | number);
    }
    return pruned;
  });

  const dataRows = prunedRows.map((row) => headers.map((key) => row[key] ?? ''));
  const columns = headers.map((key) => ({ key, label: labels[key] ?? key }));

  return { headers, dataRows, columns, prunedRows };
}

async function buildExportBundle(
  auth: ReturnType<typeof requireAuthUser>,
  farmId: string,
  dataset: string,
  from: Date,
  toExclusive: Date,
  kindFilter?: 'INCOME' | 'EXPENSE',
): Promise<ExportBundle> {
  if (dataset === 'milk') {
    const rows = await prisma.milkRecord.findMany({
      where: { farmId, date: { gte: from, lt: toExclusive }, ...notDeleted },
      orderBy: { date: 'asc' },
      include: { cattle: { select: { tagNumber: true, name: true } } },
    });
    const headers = [
      'date',
      'milkType',
      'cattleTag',
      'cattleName',
      'amTotal',
      'noonTotal',
      'pmTotal',
      'totalProduced',
      'totalUsed',
      'calfMilk',
      'rejectedMilk',
      'destination',
      'buyer',
      'pricePerLiter',
      'fatPercent',
      'proteinPercent',
      'somaticCellCount',
      'notes',
    ];
    const dataRows = rows.map((row) => [
      isoDate(row.date),
      row.milkType,
      row.cattle?.tagNumber ?? '',
      row.cattle?.name ?? '',
      Number(row.amTotal),
      Number(row.noonTotal),
      Number(row.pmTotal),
      Number(row.totalProduced),
      Number(row.totalUsed),
      Number(row.calfMilk),
      Number(row.rejectedMilk),
      row.destination ?? '',
      row.buyer ?? '',
      Number(row.pricePerLiter),
      Number(row.fatPercent),
      Number(row.proteinPercent),
      Number(row.somaticCellCount),
      row.notes ?? '',
    ]);
    return {
      filenameBase: 'milk',
      reportTitle: 'Milk Report',
      headers,
      rows: dataRows,
      columns: headers.map((key) => ({ key, label: key })),
      objectRows: dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]!]))),
      summaryLines: [
        { label: 'Records', value: String(rows.length) },
        {
          label: 'Total produced (L)',
          value: String(rows.reduce((sum, row) => sum + Number(row.totalProduced), 0).toFixed(2)),
        },
      ],
    };
  }

  if (dataset === 'transactions') {
    if (!canViewFinance(auth)) {
      throw new ApiError(403, 'You do not have permission to export financial records.');
    }
    const rows = await prisma.transaction.findMany({
      where: {
        farmId,
        date: { gte: from, lt: toExclusive },
        ...(kindFilter ? { kind: kindFilter } : {}),
        ...notDeleted,
      },
      orderBy: { date: 'asc' },
    });
    const headers = [
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
    ];
    const dataRows = rows.map((row) => [
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
    ]);
    const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const label = kindFilter === 'INCOME' ? 'Income' : kindFilter === 'EXPENSE' ? 'Expense' : 'Finance';
    return {
      filenameBase: kindFilter ? kindFilter.toLowerCase() : 'transactions',
      reportTitle: `${label} Report`,
      headers,
      rows: dataRows,
      columns: headers.map((key) => ({ key, label: key })),
      objectRows: dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]!]))),
      summaryLines: [
        { label: 'Records', value: String(rows.length) },
        { label: 'Total amount', value: total.toFixed(2) },
      ],
    };
  }

  if (dataset === 'events') {
    const rows = await prisma.healthEvent.findMany({
      where: { farmId, eventDate: { gte: from, lt: toExclusive }, ...notDeleted },
      orderBy: { eventDate: 'asc' },
      include: { cattle: { select: { tagNumber: true } } },
    });

    const objectRows = rows.map((row) => buildEventReportRow(row));
    const { headers, dataRows, columns, prunedRows } = pruneEmptyReportColumns(objectRows, EVENT_COLUMN_ORDER, EVENT_COLUMN_LABELS);

    return {
      filenameBase: 'events',
      reportTitle: 'Events Report',
      headers,
      rows: dataRows,
      columns,
      objectRows: prunedRows,
      summaryLines: [{ label: 'Events', value: String(rows.length) }],
    };
  }

  if (dataset === 'cattle') {
    const rows = await prisma.cattle.findMany({
      where: { farmId, ...notDeleted },
      orderBy: { tagNumber: 'asc' },
    });
    const headers = [
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
    ];
    const dataRows = rows.map((row) => [
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
    ]);
    return {
      filenameBase: 'cattle',
      reportTitle: 'Herd Report',
      headers,
      rows: dataRows,
      columns: headers.map((key) => ({ key, label: key })),
      objectRows: dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]!]))),
      summaryLines: [{ label: 'Animals', value: String(rows.length) }],
    };
  }

  throw new ApiError(400, 'dataset must be milk, transactions, events, or cattle.');
}

reportRouter.get(
  '/dashboard',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(dayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [calves, cows, bulls, milkToday, healthAlerts, incomeThisMonth, expensesThisMonth] = await Promise.all([
      prisma.cattle.count({ where: { farmId, stage: 'CALF', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.cattle.count({ where: { farmId, stage: { in: ['COW', 'HEIFER'] }, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.cattle.count({ where: { farmId, stage: 'BULL', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] }, ...notDeleted } }),
      prisma.milkRecord.aggregate({ where: { farmId, date: { gte: dayStart, lt: tomorrow }, ...notDeleted }, _sum: { totalProduced: true } }),
      prisma.healthEvent.count({ where: { farmId, followUpDate: { lte: dayStart }, ...notDeleted } }),
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
          _sum: { totalProduced: true, totalUsed: true, calfMilk: true, rejectedMilk: true },
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
    const calfMilk = Number(milkAgg._sum.calfMilk ?? 0);
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
        calfMilk,
        rejected,
        soldEstimate: Math.max(0, Number((produced - used - calfMilk - rejected).toFixed(2))),
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
  '/details',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const dataset = String(request.query.dataset ?? 'milk').toLowerCase();
    const { from, toExclusive, toInclusive } = parseDateRange(request.query.from, request.query.to);
    const kindRaw = String(request.query.kind ?? '').trim().toUpperCase();
    const kindFilter = kindRaw === 'INCOME' || kindRaw === 'EXPENSE' ? kindRaw : undefined;

    const [farm, bundle] = await Promise.all([
      loadFarmReportInfo(farmId),
      buildExportBundle(auth, farmId, dataset, from, toExclusive, kindFilter),
    ]);

    response.json({
      farm,
      reportTitle: bundle.reportTitle,
      from: isoDate(from),
      to: isoDate(toInclusive),
      columns: bundle.columns,
      rows: bundle.objectRows,
      summaryLines: bundle.summaryLines ?? [],
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
    const { from, toExclusive, toInclusive } = parseDateRange(request.query.from, request.query.to);
    const kindRaw = String(request.query.kind ?? '').trim().toUpperCase();
    const kindFilter = kindRaw === 'INCOME' || kindRaw === 'EXPENSE' ? kindRaw : undefined;

    const [farm, bundle] = await Promise.all([
      loadFarmReportInfo(farmId),
      buildExportBundle(auth, farmId, dataset, from, toExclusive, kindFilter),
    ]);

    const periodFrom = isoDate(from);
    const periodTo = isoDate(toInclusive);
    const csv = toCsvWithFarmHeader(
      farm,
      {
        reportTitle: bundle.reportTitle,
        periodFrom,
        periodTo,
        generatedBy: `${auth.firstName} ${auth.lastName}`.trim(),
      },
      bundle.headers,
      bundle.rows,
    );

    const filename = `inka-${bundle.filenameBase}-${periodFrom}-${periodTo}.csv`;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.send(csv);
  }),
);

reportRouter.get(
  '/export.pdf',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const farmId = await resolveFarmIdForRequest(auth, requested);
    const dataset = String(request.query.dataset ?? 'milk').toLowerCase();
    const { from, toExclusive, toInclusive } = parseDateRange(request.query.from, request.query.to);
    const kindRaw = String(request.query.kind ?? '').trim().toUpperCase();
    const kindFilter = kindRaw === 'INCOME' || kindRaw === 'EXPENSE' ? kindRaw : undefined;

    const [farm, bundle] = await Promise.all([
      loadFarmReportInfo(farmId),
      buildExportBundle(auth, farmId, dataset, from, toExclusive, kindFilter),
    ]);

    const periodFrom = isoDate(from);
    const periodTo = isoDate(toInclusive);
    const pdf = await renderFarmReportPdf({
      farm,
      reportTitle: bundle.reportTitle,
      periodFrom,
      periodTo,
      generatedAt: new Date().toISOString(),
      generatedBy: `${auth.firstName} ${auth.lastName}`.trim(),
      columns: bundle.columns,
      rows: bundle.objectRows,
      summaryLines: bundle.summaryLines,
    });

    const filename = `inka-${bundle.filenameBase}-${periodFrom}-${periodTo}.pdf`;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.send(pdf);
  }),
);

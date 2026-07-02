import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportRouter = Router();

reportRouter.get(
  '/dashboard',
  asyncHandler(async (request, response) => {
    const farmId = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [calves, cows, bulls, milkToday, healthAlerts, incomeThisMonth, expensesThisMonth] = await Promise.all([
      prisma.cattle.count({ where: { farmId, stage: 'CALF', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] } } }),
      prisma.cattle.count({ where: { farmId, stage: { in: ['COW', 'HEIFER'] }, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] } } }),
      prisma.cattle.count({ where: { farmId, stage: 'BULL', status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] } } }),
      prisma.milkRecord.aggregate({ where: { farmId, date: { gte: today, lt: tomorrow } }, _sum: { totalProduced: true } }),
      prisma.healthEvent.count({ where: { farmId, followUpDate: { lte: today } } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'INCOME', date: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'EXPENSE', date: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
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
    const farmId = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;

    const [cattleTotal, milkTotal, eventTotal, breedingTotal, pregnantTotal, incomeTotal, expenseTotal, latestWeight] = await Promise.all([
      prisma.cattle.count({ where: { farmId, status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] } } }),
      prisma.milkRecord.aggregate({ where: { farmId }, _sum: { totalProduced: true } }),
      prisma.healthEvent.count({ where: { farmId } }),
      prisma.healthEvent.count({ where: { farmId, eventType: { equals: 'Breeding', mode: 'insensitive' } } }),
      prisma.healthEvent.count({ where: { farmId, eventType: { equals: 'Pregnant', mode: 'insensitive' } } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { farmId, kind: 'EXPENSE' }, _sum: { amount: true } }),
      prisma.cattle.findFirst({ where: { farmId, weightKg: { gt: 0 } }, orderBy: { updatedAt: 'desc' }, select: { weightKg: true } }),
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { ApiError } from '../utils/apiError.js';
import { isFarmOwner, isSuperAdmin, resolveFarmIdForUser } from '../utils/permissions.js';

export const auditLogRouter = Router();

auditLogRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    if (!isFarmOwner(auth)) {
      throw new ApiError(403, 'Only farm owners can view the activity log.');
    }

    const query = request.query as Record<string, unknown>;
    const requestedFarmId = typeof query.farmId === 'string' ? query.farmId : undefined;
    const farmId = resolveFarmIdForUser(auth, requestedFarmId);
    if (!farmId && !isSuperAdmin(auth)) {
      throw new ApiError(403, 'Your account is not linked to a farm.');
    }

    const entityType = typeof query.entityType === 'string' ? query.entityType.trim() : '';
    const fromRaw = typeof query.from === 'string' ? query.from : '';
    const toRaw = typeof query.to === 'string' ? query.to : '';
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 50) || 50));
    const skip = (page - 1) * limit;

    const fromDate = fromRaw ? new Date(`${fromRaw}T00:00:00`) : null;
    const toDate = toRaw ? new Date(`${toRaw}T23:59:59.999`) : null;
    if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
      throw new ApiError(400, 'from and to must be valid YYYY-MM-DD dates.');
    }

    const where = {
      ...(farmId ? { farmId } : {}),
      ...(entityType ? { entityType } : {}),
      ...((fromDate || toDate)
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    response.json({
      page,
      limit,
      total,
      items: rows.map((row) => ({
        id: row.id,
        farmId: row.farmId,
        actorId: row.actorId,
        actorName: row.actor
          ? `${row.actor.firstName} ${row.actor.lastName}`.trim() || row.actor.email
          : null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        summary: row.summary,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  }),
);

import { Router } from 'express';
import type { ZodType } from 'zod';
import { prisma } from '../config/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/apiError.js';

type PrismaDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};

type CrudOptions = {
  model: PrismaDelegate;
  resourceName: string;
  createSchema: ZodType;
  updateSchema: ZodType;
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, unknown>;
  listWhere?: (query: Record<string, unknown>) => Record<string, unknown>;
  createData?: (body: Record<string, unknown>) => Record<string, unknown>;
  updateData?: (body: Record<string, unknown>) => Record<string, unknown>;
};

export function createCrudRouter(options: CrudOptions) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      const records = await options.model.findMany({
        where: options.listWhere?.(request.query) ?? {},
        orderBy: options.defaultOrderBy,
        include: options.include,
      });
      response.json(records);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (request, response) => {
      const record = await options.model.findUnique({ where: { id: request.params.id }, include: options.include });
      if (!record) {
        throw notFound(options.resourceName);
      }
      response.json(record);
    }),
  );

  router.post(
    '/',
    validateBody(options.createSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as Record<string, unknown>;
      const record = await options.model.create({ data: options.createData?.(body) ?? body, include: options.include });
      response.status(201).json(record);
    }),
  );

  router.patch(
    '/:id',
    validateBody(options.updateSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as Record<string, unknown>;
      const record = await options.model.update({
        where: { id: request.params.id },
        data: options.updateData?.(body) ?? body,
        include: options.include,
      });
      response.json(record);
    }),
  );

  return router;
}

export const models = {
  farm: prisma.farm as unknown as PrismaDelegate,
  category: prisma.category as unknown as PrismaDelegate,
  cattle: prisma.cattle as unknown as PrismaDelegate,
  milkRecord: prisma.milkRecord as unknown as PrismaDelegate,
  healthEvent: prisma.healthEvent as unknown as PrismaDelegate,
  transaction: prisma.transaction as unknown as PrismaDelegate,
};

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
  delete: (args: unknown) => Promise<unknown>;
};

export type CrudOptions = {
  model: PrismaDelegate;
  resourceName: string;
  createSchema: ZodType;
  updateSchema: ZodType;
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, unknown>;
  listWhere?: (query: Record<string, unknown>) => Record<string, unknown>;
  createData?: (body: Record<string, unknown>) => Record<string, unknown>;
  updateData?: (body: Record<string, unknown>) => Record<string, unknown>;
  beforeCreate?: (body: Record<string, unknown>) => Promise<void>;
  beforeUpdate?: (id: string, body: Record<string, unknown>) => Promise<void>;
  beforeDelete?: (id: string, existing: Record<string, unknown>) => Promise<void>;
  afterCreate?: (body: Record<string, unknown>, record: Record<string, unknown>) => Promise<void>;
  afterUpdate?: (id: string, body: Record<string, unknown>, record: Record<string, unknown>) => Promise<void>;
  beforeList?: () => Promise<void>;
};

/** Shared factory for standard list / get / create / update / delete resource routes. */
export function createCrudRouter(options: CrudOptions) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      await options.beforeList?.();
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
      const record = await options.model.findUnique({
        where: { id: request.params.id },
        include: options.include,
      });
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
      await options.beforeCreate?.(body);
      const record = await options.model.create({
        data: options.createData?.(body) ?? body,
        include: options.include,
      });
      await options.afterCreate?.(body, record as Record<string, unknown>);
      response.status(201).json(record);
    }),
  );

  router.patch(
    '/:id',
    validateBody(options.updateSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as Record<string, unknown>;
      await options.beforeUpdate?.(String(request.params.id), body);
      const record = await options.model.update({
        where: { id: request.params.id },
        data: options.updateData?.(body) ?? body,
        include: options.include,
      });
      await options.afterUpdate?.(String(request.params.id), body, record as Record<string, unknown>);
      response.json(record);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (request, response) => {
      const existing = await options.model.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        throw notFound(options.resourceName);
      }
      await options.beforeDelete?.(String(request.params.id), existing as Record<string, unknown>);
      await options.model.delete({ where: { id: request.params.id } });
      response.status(204).send();
    }),
  );

  return router;
}

/** Prisma model delegates used by resource route files. */
export const models = {
  farm: prisma.farm as unknown as PrismaDelegate,
  category: prisma.category as unknown as PrismaDelegate,
  cattle: prisma.cattle as unknown as PrismaDelegate,
  milkRecord: prisma.milkRecord as unknown as PrismaDelegate,
  healthEvent: prisma.healthEvent as unknown as PrismaDelegate,
  transaction: prisma.transaction as unknown as PrismaDelegate,
};

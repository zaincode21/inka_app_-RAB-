import { Router } from 'express';
import type { Request } from 'express';
import type { ZodType } from 'zod';
import { prisma } from '../config/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, notFound } from '../utils/apiError.js';
import { isSuperAdmin, resolveFarmIdForUser, type AuthUser } from '../utils/permissions.js';
import { requireAuthUser } from '../middleware/auth.js';
import { isDeleted, notDeleted, onlyDeleted, restoreData, softDeleteData } from '../utils/softDelete.js';
import { recordFarmId, recordId, writeAudit } from '../services/auditService.js';

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
  /** When true, list/create/read/update/delete are scoped to the auth user's farm. */
  farmScoped?: boolean;
  /** How to read farm id from a record (default: record.farmId). Use for Farm model itself. */
  recordFarmId?: (record: Record<string, unknown>) => string | null;
  /** Extra access check after loading a record (get/update/delete). */
  assertRecordAccess?: (auth: AuthUser, record: Record<string, unknown>) => void;
  listWhere?: (query: Record<string, unknown>, auth: AuthUser) => Record<string, unknown>;
  createData?: (body: Record<string, unknown>, auth: AuthUser) => Record<string, unknown>;
  updateData?: (body: Record<string, unknown>, auth: AuthUser) => Record<string, unknown>;
  beforeCreate?: (body: Record<string, unknown>, auth: AuthUser) => Promise<void>;
  beforeUpdate?: (id: string, body: Record<string, unknown>, auth: AuthUser) => Promise<void>;
  beforeDelete?: (id: string, existing: Record<string, unknown>, auth: AuthUser) => Promise<void>;
  afterRestore?: (id: string, record: Record<string, unknown>, auth: AuthUser) => Promise<void>;
  afterCreate?: (body: Record<string, unknown>, record: Record<string, unknown>, auth: AuthUser) => Promise<void>;
  afterUpdate?: (
    id: string,
    body: Record<string, unknown>,
    record: Record<string, unknown>,
    auth: AuthUser,
  ) => Promise<void>;
  beforeList?: (auth: AuthUser) => Promise<void>;
  canCreate?: (auth: AuthUser) => boolean;
  canUpdate?: (auth: AuthUser) => boolean;
  canDelete?: (auth: AuthUser) => boolean;
  /** Defaults to canDelete when softDelete is enabled. */
  canRestore?: (auth: AuthUser) => boolean;
  /** When true, set createdByUserId / updatedByUserId from the authenticated user. */
  trackActor?: boolean;
  /** When true, DELETE sets deletedAt instead of removing the row; lists exclude archived. */
  softDelete?: boolean;
  /** When set, create/update/delete write AuditLog rows for this entity type. */
  auditEntityType?: string;
};

const actorInclude = {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

function withActorInclude(include: Record<string, unknown> | undefined, trackActor: boolean) {
  if (!trackActor) {
    return include;
  }
  return {
    ...include,
    ...actorInclude,
  };
}

function stripProtectedFields(data: Record<string, unknown>) {
  const next = { ...data };
  delete next.createdByUserId;
  delete next.updatedByUserId;
  delete next.createdBy;
  delete next.updatedBy;
  delete next.deletedAt;
  delete next.deletedByUserId;
  delete next.deletedBy;
  return next;
}

function assertFarmAccess(
  auth: AuthUser,
  record: Record<string, unknown>,
  resourceName: string,
  recordFarmId?: (record: Record<string, unknown>) => string | null,
) {
  if (isSuperAdmin(auth)) {
    return;
  }
  const id = recordFarmId?.(record) ?? (typeof record.farmId === 'string' ? record.farmId : null);
  if (!auth.farmId || !id || id !== auth.farmId) {
    throw notFound(resourceName);
  }
}

function farmScopeWhere(auth: AuthUser, query: Record<string, unknown>): Record<string, unknown> {
  const requested = typeof query.farmId === 'string' ? query.farmId : undefined;
  const farmId = resolveFarmIdForUser(auth, requested);
  if (farmId) {
    return { farmId };
  }
  if (isSuperAdmin(auth)) {
    return {};
  }
  throw new ApiError(403, 'Your account is not linked to a farm.');
}

function assertActiveRecord(record: Record<string, unknown>, resourceName: string, softDelete: boolean) {
  if (softDelete && isDeleted(record)) {
    throw notFound(resourceName);
  }
}

/** Shared factory for standard list / get / create / update / delete resource routes. */
export function createCrudRouter(options: CrudOptions) {
  const router = Router();
  const farmScoped = options.farmScoped !== false;
  const trackActor = Boolean(options.trackActor);
  const softDelete = Boolean(options.softDelete);
  const auditEntityType = options.auditEntityType?.trim() || null;
  const include = withActorInclude(options.include, trackActor);

  const canRestore =
    options.canRestore ??
    ((auth: AuthUser) => (options.canDelete ? options.canDelete(auth) : true));

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      const auth = requireAuthUser(request);
      await options.beforeList?.(auth);
      const query = request.query as Record<string, unknown>;
      const listArchived = softDelete && query.archived === 'true';
      if (listArchived && !canRestore(auth)) {
        throw new ApiError(403, 'You do not have permission to view archived records.');
      }
      const extraWhere = options.listWhere?.(query, auth) ?? {};
      const where = {
        ...(farmScoped ? farmScopeWhere(auth, query) : {}),
        ...(softDelete ? (listArchived ? onlyDeleted : notDeleted) : {}),
        ...extraWhere,
      };
      const records = await options.model.findMany({
        where,
        orderBy: options.defaultOrderBy,
        include,
      });
      response.json(records);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (request, response) => {
      const auth = requireAuthUser(request);
      const record = await options.model.findUnique({
        where: { id: request.params.id },
        include,
      });
      if (!record) {
        throw notFound(options.resourceName);
      }
      assertActiveRecord(record as Record<string, unknown>, options.resourceName, softDelete);
      if (farmScoped) {
        assertFarmAccess(auth, record as Record<string, unknown>, options.resourceName, options.recordFarmId);
      }
      options.assertRecordAccess?.(auth, record as Record<string, unknown>);
      response.json(record);
    }),
  );

  router.post(
    '/',
    validateBody(options.createSchema),
    asyncHandler(async (request, response) => {
      const auth = requireAuthUser(request);
      if (options.canCreate && !options.canCreate(auth)) {
        throw new ApiError(403, 'You do not have permission to create this record.');
      }
      const body = { ...(request.body as Record<string, unknown>) };
      if (farmScoped) {
        const requested = typeof body.farmId === 'string' ? body.farmId : undefined;
        const farmId = resolveFarmIdForUser(auth, requested) ?? auth.farmId;
        if (!farmId) {
          throw new ApiError(400, 'farmId is required.');
        }
        if (!isSuperAdmin(auth) && farmId !== auth.farmId) {
          throw new ApiError(403, 'You cannot create records for another farm.');
        }
        body.farmId = farmId;
      }
      await options.beforeCreate?.(body, auth);
      let data = stripProtectedFields(options.createData?.(body, auth) ?? body);
      if (trackActor) {
        data = {
          ...data,
          createdByUserId: auth.id,
          updatedByUserId: auth.id,
        };
      }
      const record = await options.model.create({
        data,
        include,
      });
      await options.afterCreate?.(body, record as Record<string, unknown>, auth);
      if (auditEntityType) {
        const created = record as Record<string, unknown>;
        await writeAudit({
          auth,
          farmId: recordFarmId(created),
          action: 'CREATE',
          entityType: auditEntityType,
          entityId: recordId(created),
          summary: `Created ${options.resourceName}`,
        });
      }
      response.status(201).json(record);
    }),
  );

  router.patch(
    '/:id',
    validateBody(options.updateSchema),
    asyncHandler(async (request, response) => {
      const auth = requireAuthUser(request);
      if (options.canUpdate && !options.canUpdate(auth)) {
        throw new ApiError(403, 'You do not have permission to update this record.');
      }
      const existing = await options.model.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        throw notFound(options.resourceName);
      }
      assertActiveRecord(existing as Record<string, unknown>, options.resourceName, softDelete);
      if (farmScoped) {
        assertFarmAccess(auth, existing as Record<string, unknown>, options.resourceName, options.recordFarmId);
      }
      options.assertRecordAccess?.(auth, existing as Record<string, unknown>);
      const body = { ...(request.body as Record<string, unknown>) };
      delete body.farmId;
      await options.beforeUpdate?.(String(request.params.id), body, auth);
      let data = stripProtectedFields(options.updateData?.(body, auth) ?? body);
      if (trackActor) {
        data = {
          ...data,
          updatedByUserId: auth.id,
        };
      }
      const record = await options.model.update({
        where: { id: request.params.id },
        data,
        include,
      });
      await options.afterUpdate?.(String(request.params.id), body, record as Record<string, unknown>, auth);
      if (auditEntityType) {
        const updated = record as Record<string, unknown>;
        await writeAudit({
          auth,
          farmId: recordFarmId(updated),
          action: 'UPDATE',
          entityType: auditEntityType,
          entityId: recordId(updated),
          summary: `Updated ${options.resourceName}`,
        });
      }
      response.json(record);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (request, response) => {
      const auth = requireAuthUser(request);
      if (options.canDelete && !options.canDelete(auth)) {
        throw new ApiError(403, 'You do not have permission to delete this record.');
      }
      const existing = await options.model.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        throw notFound(options.resourceName);
      }
      assertActiveRecord(existing as Record<string, unknown>, options.resourceName, softDelete);
      if (farmScoped) {
        assertFarmAccess(auth, existing as Record<string, unknown>, options.resourceName, options.recordFarmId);
      }
      options.assertRecordAccess?.(auth, existing as Record<string, unknown>);
      await options.beforeDelete?.(String(request.params.id), existing as Record<string, unknown>, auth);
      if (softDelete) {
        await options.model.update({
          where: { id: request.params.id },
          data: softDeleteData(auth.id),
        });
      } else {
        await options.model.delete({ where: { id: request.params.id } });
      }
      if (auditEntityType) {
        const deleted = existing as Record<string, unknown>;
        await writeAudit({
          auth,
          farmId: recordFarmId(deleted),
          action: softDelete ? 'SOFT_DELETE' : 'DELETE',
          entityType: auditEntityType,
          entityId: recordId(deleted),
          summary: softDelete ? `Archived ${options.resourceName}` : `Deleted ${options.resourceName}`,
        });
      }
      response.status(204).send();
    }),
  );

  if (softDelete) {
    router.post(
      '/:id/restore',
      asyncHandler(async (request, response) => {
        const auth = requireAuthUser(request);
        if (!canRestore(auth)) {
          throw new ApiError(403, 'You do not have permission to restore this record.');
        }
        const existing = await options.model.findUnique({
          where: { id: request.params.id },
          include,
        });
        if (!existing) {
          throw notFound(options.resourceName);
        }
        const record = existing as Record<string, unknown>;
        if (!isDeleted(record)) {
          throw new ApiError(400, `${options.resourceName} is not archived.`);
        }
        if (farmScoped) {
          assertFarmAccess(auth, record, options.resourceName, options.recordFarmId);
        }
        options.assertRecordAccess?.(auth, record);
        const restored = (await options.model.update({
          where: { id: request.params.id },
          data: {
            ...restoreData(),
            ...(trackActor ? { updatedByUserId: auth.id } : {}),
          },
          include,
        })) as Record<string, unknown>;
        await options.afterRestore?.(String(request.params.id), restored, auth);
        if (auditEntityType) {
          await writeAudit({
            auth,
            farmId: recordFarmId(restored),
            action: 'RESTORE',
            entityType: auditEntityType,
            entityId: recordId(restored),
            summary: `Restored ${options.resourceName}`,
          });
        }
        response.json(restored);
      }),
    );
  }

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

export type { Request };

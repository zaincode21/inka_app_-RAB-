import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import type { AuthUser } from '../utils/permissions.js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'DELETE' | 'LOGIN' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET';

type WriteAuditInput = {
  auth?: Pick<AuthUser, 'id' | 'farmId'> | null;
  farmId?: string | null;
  actorId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Best-effort audit write — never throws to the caller. */
export async function writeAudit(input: WriteAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        farmId: input.farmId ?? input.auth?.farmId ?? null,
        actorId: input.actorId ?? input.auth?.id ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error('[audit] Failed to write audit log:', error);
  }
}

export function recordFarmId(record: Record<string, unknown>): string | null {
  return typeof record.farmId === 'string' ? record.farmId : null;
}

export function recordId(record: Record<string, unknown>): string | null {
  return typeof record.id === 'string' ? record.id : null;
}

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const allowedOwnerTypes = new Set(['cattle', 'healthEvent', 'transaction', 'milkRecord']);

export function ensureUploadDir(): string {
  const absolute = path.isAbsolute(env.uploadDir) ? env.uploadDir : path.join(process.cwd(), env.uploadDir);
  mkdirSync(absolute, { recursive: true });
  return absolute;
}

export function publicUploadUrl(filename: string): string {
  return `${env.publicBaseUrl}/uploads/${filename}`;
}

export async function createAttachmentRecord(input: {
  ownerType: string;
  uri: string;
  label?: string | null;
  cattleId?: string | null;
  milkRecordId?: string | null;
  healthEventId?: string | null;
  transactionId?: string | null;
}) {
  const ownerType = input.ownerType.trim();
  if (!allowedOwnerTypes.has(ownerType)) {
    throw new ApiError(400, 'ownerType must be cattle, healthEvent, transaction, or milkRecord.');
  }

  return prisma.attachment.create({
    data: {
      ownerType,
      uri: input.uri,
      label: input.label?.trim() || null,
      cattleId: input.cattleId || null,
      milkRecordId: input.milkRecordId || null,
      healthEventId: input.healthEventId || null,
      transactionId: input.transactionId || null,
    },
  });
}

export async function listAttachments(query: {
  cattleId?: string;
  healthEventId?: string;
  transactionId?: string;
  milkRecordId?: string;
  ownerType?: string;
}) {
  return prisma.attachment.findMany({
    where: {
      ...(query.cattleId ? { cattleId: query.cattleId } : {}),
      ...(query.healthEventId ? { healthEventId: query.healthEventId } : {}),
      ...(query.transactionId ? { transactionId: query.transactionId } : {}),
      ...(query.milkRecordId ? { milkRecordId: query.milkRecordId } : {}),
      ...(query.ownerType ? { ownerType: query.ownerType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

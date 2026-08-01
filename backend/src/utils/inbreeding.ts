import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { notDeleted } from './softDelete.js';

type CattleLineage = {
  tagNumber: string;
  name: string;
  motherTag: string | null;
  fatherTag: string | null;
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findInHerd(herd: CattleLineage[], token: string): CattleLineage | undefined {
  const normalized = normalizeToken(token);
  if (!normalized) {
    return undefined;
  }

  return herd.find((animal) => {
    const tag = normalizeToken(animal.tagNumber);
    const name = normalizeToken(animal.name);
    return normalized === tag || normalized === name || normalized.includes(tag) || tag.includes(normalized) || (name && (normalized === name || normalized.includes(name) || name.includes(normalized)));
  });
}

function sameSireReference(a: string, b: string, herd: CattleLineage[]): boolean {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) {
    return false;
  }

  if (normalizeToken(left) === normalizeToken(right)) {
    return true;
  }

  const leftRecord = findInHerd(herd, left);
  const rightRecord = findInHerd(herd, right);

  if (leftRecord && rightRecord && leftRecord.tagNumber === rightRecord.tagNumber) {
    return true;
  }

  if (leftRecord) {
    const tag = normalizeToken(leftRecord.tagNumber);
    const name = normalizeToken(leftRecord.name);
    const rightNorm = normalizeToken(right);
    if (rightNorm === tag || rightNorm === name) {
      return true;
    }
  }

  if (rightRecord) {
    const tag = normalizeToken(rightRecord.tagNumber);
    const name = normalizeToken(rightRecord.name);
    const leftNorm = normalizeToken(left);
    if (leftNorm === tag || leftNorm === name) {
      return true;
    }
  }

  const leftNorm = normalizeToken(left);
  const rightNorm = normalizeToken(right);
  return leftNorm.includes(rightNorm) || rightNorm.includes(leftNorm);
}

const inbreedingCheckEventTypes = new Set(['breeding', 'pregnant', 'pregnancy diagnosis']);

export async function assertNoInbreedingForHealthEvent(body: Record<string, unknown>): Promise<void> {
  const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
  if (!inbreedingCheckEventTypes.has(eventType)) {
    return;
  }

  const cattleId = typeof body.cattleId === 'string' ? body.cattleId : null;
  const bullResponsible = typeof body.bullResponsible === 'string' ? body.bullResponsible.trim() : '';
  if (!cattleId || !bullResponsible) {
    return;
  }

  const animal = await prisma.cattle.findFirst({
    where: { id: cattleId, ...notDeleted },
    select: {
      tagNumber: true,
      name: true,
      motherTag: true,
      fatherTag: true,
    },
  });

  if (!animal) {
    return;
  }

  const herd = await prisma.cattle.findMany({
    where: notDeleted,
    select: {
      tagNumber: true,
      name: true,
      motherTag: true,
      fatherTag: true,
    },
  });

  if (animal.fatherTag?.trim() && sameSireReference(bullResponsible, animal.fatherTag, herd)) {
    throw new ApiError(400, 'This bull matches the animal\'s father. Breeding is not allowed.');
  }

  const mother = animal.motherTag?.trim() ? findInHerd(herd, animal.motherTag) : undefined;
  const maternalGrandfather = mother?.fatherTag?.trim() ?? '';
  if (maternalGrandfather && sameSireReference(bullResponsible, maternalGrandfather, herd)) {
    throw new ApiError(400, 'This bull matches the animal\'s maternal grandfather (mother\'s father). Breeding is not allowed.');
  }
}

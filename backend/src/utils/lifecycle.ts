import { prisma } from '../config/prisma.js';

type CattleStage = 'CALF' | 'WEANER' | 'HEIFER' | 'COW' | 'BULL' | 'STEER';
type CattleRecord = {
  id: string;
  sex: 'MALE' | 'FEMALE';
  stage: CattleStage;
  status: string;
  dateOfBirth: Date | null;
  parity: number;
};

const inactiveStatuses = new Set(['DEAD', 'SOLD', 'CULLED', 'INACTIVE']);

const femaleStageRank: Record<CattleStage, number> = {
  CALF: 1,
  WEANER: 2,
  HEIFER: 3,
  COW: 4,
  BULL: 0,
  STEER: 0,
};

const maleStageRank: Record<CattleStage, number> = {
  CALF: 1,
  WEANER: 2,
  STEER: 3,
  BULL: 4,
  HEIFER: 0,
  COW: 0,
};

export function ageInMonths(dateOfBirth: Date | null, reference = new Date()): number | null {
  if (!dateOfBirth) {
    return null;
  }
  const years = reference.getFullYear() - dateOfBirth.getFullYear();
  const months = reference.getMonth() - dateOfBirth.getMonth();
  const days = reference.getDate() - dateOfBirth.getDate();
  let totalMonths = years * 12 + months;
  if (days < 0) {
    totalMonths -= 1;
  }
  return Math.max(0, totalMonths);
}

export function suggestedStageForCattle(animal: CattleRecord): CattleStage | null {
  if (inactiveStatuses.has(animal.status)) {
    return null;
  }

  if (animal.parity >= 1) {
    return animal.sex === 'FEMALE' ? 'COW' : animal.stage;
  }

  const ageMonths = ageInMonths(animal.dateOfBirth);
  if (ageMonths === null) {
    return null;
  }

  if (animal.sex === 'FEMALE') {
    if (ageMonths >= 12) {
      return 'HEIFER';
    }
    if (ageMonths >= 6) {
      return 'WEANER';
    }
    return 'CALF';
  }

  if (ageMonths >= 12) {
    return animal.stage === 'STEER' ? 'STEER' : 'WEANER';
  }
  if (ageMonths >= 6) {
    return 'WEANER';
  }
  return 'CALF';
}

function shouldPromoteStage(current: CattleStage, suggested: CattleStage, sex: 'MALE' | 'FEMALE'): boolean {
  const ranks = sex === 'FEMALE' ? femaleStageRank : maleStageRank;
  return ranks[suggested] > ranks[current];
}

export async function promoteCattleStagesByAge(): Promise<number> {
  const herd = await prisma.cattle.findMany({
    where: {
      status: { notIn: ['DEAD', 'SOLD', 'CULLED', 'INACTIVE'] },
    },
    select: {
      id: true,
      sex: true,
      stage: true,
      status: true,
      dateOfBirth: true,
      parity: true,
    },
  });

  let updated = 0;
  for (const animal of herd) {
    const suggested = suggestedStageForCattle(animal);
    if (!suggested || !shouldPromoteStage(animal.stage, suggested, animal.sex)) {
      continue;
    }

    await prisma.cattle.update({
      where: { id: animal.id },
      data: { stage: suggested },
    });
    updated += 1;
  }

  return updated;
}

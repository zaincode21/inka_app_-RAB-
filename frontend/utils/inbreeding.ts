export type CattleLineage = {
  tagNumber: string;
  name: string;
  motherTag: string;
  fatherTag: string;
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

export function sameSireReference(a: string, b: string, herd: CattleLineage[]): boolean {
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

export function getInbreedingViolation(animal: CattleLineage | undefined, bullResponsible: string, herd: CattleLineage[]): string | null {
  const bull = bullResponsible.trim();
  if (!animal || !bull) {
    return null;
  }

  if (animal.fatherTag.trim() && sameSireReference(bull, animal.fatherTag, herd)) {
    return 'This bull matches the animal\'s father. Breeding is not allowed.';
  }

  const mother = animal.motherTag.trim() ? findInHerd(herd, animal.motherTag) : undefined;
  const maternalGrandfatherTag = mother?.fatherTag.trim() ?? '';
  if (maternalGrandfatherTag && sameSireReference(bull, maternalGrandfatherTag, herd)) {
    return 'This bull matches the animal\'s maternal grandfather (mother\'s father). Breeding is not allowed.';
  }

  return null;
}

export const INBREEDING_CHECK_EVENT_TYPES = new Set(['Breeding', 'Pregnant', 'Pregnancy Diagnosis']);

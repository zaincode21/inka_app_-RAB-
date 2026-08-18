function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, ' ');
}

export const COW_ONLY_EVENT_TYPES = new Set(['Breeding', 'Pregnant', 'Aborted', 'Giving Birth']);

export function isFemaleCattle(animal: { gender: string }): boolean {
  return normalize(animal.gender) === 'female';
}

export function isCowStage(animal: { stage: string }): boolean {
  return normalize(animal.stage) === 'cow';
}

function isPregnantOrDry(animal: { reproductiveStatus: string }): boolean {
  const status = normalize(animal.reproductiveStatus);
  return status === 'pregnant' || status === 'dry';
}

export function isCowOnlyEventType(eventType: string): boolean {
  return COW_ONLY_EVENT_TYPES.has(eventType);
}

/** Breeding: non-pregnant cows only. Pregnant / Abort / Birth: cows only. Heifers are not eligible. */
export function isEligibleForCowReproductiveEvent(
  eventType: string,
  animal: { gender: string; stage: string; reproductiveStatus: string },
): boolean {
  return cowReproductiveIneligibleReason(eventType, animal) === null;
}

export function cowReproductiveIneligibleReason(
  eventType: string,
  animal: { gender: string; stage: string; reproductiveStatus: string },
): string | null {
  if (!isCowOnlyEventType(eventType)) {
    return null;
  }
  if (!isFemaleCattle(animal)) {
    return 'This event can only be recorded for female cattle.';
  }
  if (!isCowStage(animal)) {
    return 'Select a cow. Heifers cannot be recorded for breeding, pregnancy, abort, or birth.';
  }
  if (eventType === 'Breeding' && isPregnantOrDry(animal)) {
    return 'This cow is already pregnant. Record abort or birth before breeding again.';
  }
  return null;
}

export function isBreedingEligibleCattle(animal: { gender: string; stage: string; reproductiveStatus: string }): boolean {
  return isEligibleForCowReproductiveEvent('Breeding', animal);
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, ' ');
}

export function isFemaleCattle(animal: { gender: string }): boolean {
  return normalize(animal.gender) === 'female';
}

export function isCowCattle(animal: { stage: string }): boolean {
  return normalize(animal.stage) === 'cow';
}

export function isHeiferCattle(animal: { stage: string }): boolean {
  return normalize(animal.stage) === 'heifer';
}

function isPregnantOrDry(animal: { reproductiveStatus: string }): boolean {
  const status = normalize(animal.reproductiveStatus);
  return status === 'pregnant' || status === 'dry';
}

export function isCowOrHeiferFemale(animal: { gender: string; stage: string }): boolean {
  return isFemaleCattle(animal) && (isCowCattle(animal) || isHeiferCattle(animal));
}

export function reproductiveEventIneligibleReason(
  animal: { gender: string; stage: string; reproductiveStatus: string },
  eventType: string,
): string | null {
  if (!isFemaleCattle(animal)) {
    return 'This event can only be recorded for female cattle.';
  }
  if (!isCowOrHeiferFemale(animal)) {
    return 'Breeding, pregnancy, abort, and birth are for heifers and cows.';
  }
  if (eventType === 'Breeding' && isPregnantOrDry(animal)) {
    return 'This animal is already pregnant. Record abort or birth before breeding again.';
  }
  return null;
}

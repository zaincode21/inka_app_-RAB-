import type { HealthEvent } from '../data/farmDatabase';
import { daysSinceEventDate } from './eventArchive';

const CYCLE_RESOLVERS = new Set(['pregnant', 'heat observed', 'aborted', 'giving birth']);
const PREGNANCY_CLOSERS = new Set(['aborted', 'giving birth']);

function normalizeType(eventType: string): string {
  return eventType.trim().toLowerCase();
}

function sameCattle(a: HealthEvent, b: HealthEvent): boolean {
  return Boolean(a.cattleTag?.trim()) && a.cattleTag.trim() === b.cattleTag.trim();
}

function isAfterOrSameDay(later: string, earlier: string): boolean {
  if (!later?.trim() || !earlier?.trim()) {
    return false;
  }
  return later.trim().slice(0, 10) >= earlier.trim().slice(0, 10);
}

/**
 * Heat / Gusama actions are available from the breeding day onward.
 * Cows can return to heat before the estimated ~21-day return date.
 */
export function isReturnHeatWindowOpen(breeding: Pick<HealthEvent, 'returnHeatDate' | 'eventDate'>, reference = new Date()): boolean {
  const days = daysSinceEventDate(breeding.eventDate, reference);
  return days !== null && days >= 0;
}

export function findsCycleChild(parent: HealthEvent, allEvents: HealthEvent[], childTypes: Set<string>): HealthEvent | undefined {
  return allEvents.find((item) => {
    if (item.id === parent.id || !sameCattle(item, parent)) {
      return false;
    }
    if (!childTypes.has(normalizeType(item.eventType))) {
      return false;
    }
    if (item.sourceEventId && item.sourceEventId === parent.id) {
      return true;
    }
    return isAfterOrSameDay(item.eventDate, parent.eventDate);
  });
}

export function isBreedingAwaitingHeatDecision(breeding: HealthEvent, allEvents: HealthEvent[], reference = new Date()): boolean {
  if (normalizeType(breeding.eventType) !== 'breeding' || breeding.scope !== 'individual') {
    return false;
  }
  if (!isReturnHeatWindowOpen(breeding, reference)) {
    return false;
  }
  return !findsCycleChild(breeding, allEvents, CYCLE_RESOLVERS);
}

export function isOpenPregnancy(pregnant: HealthEvent, allEvents: HealthEvent[]): boolean {
  if (normalizeType(pregnant.eventType) !== 'pregnant' || pregnant.scope !== 'individual') {
    return false;
  }
  return !findsCycleChild(pregnant, allEvents, PREGNANCY_CLOSERS);
}

/** Breeding that already moved on (Heat / Gusama / Abort / Birth). */
export function getBreedingResolution(breeding: HealthEvent, allEvents: HealthEvent[]): HealthEvent | undefined {
  if (normalizeType(breeding.eventType) !== 'breeding' || breeding.scope !== 'individual') {
    return undefined;
  }
  return findsCycleChild(breeding, allEvents, CYCLE_RESOLVERS);
}

export function isEndedBreeding(breeding: HealthEvent, allEvents: HealthEvent[]): boolean {
  return Boolean(getBreedingResolution(breeding, allEvents));
}

/** Pregnant that already moved on (Abort / Birth). */
export function getPregnancyResolution(pregnant: HealthEvent, allEvents: HealthEvent[]): HealthEvent | undefined {
  if (normalizeType(pregnant.eventType) !== 'pregnant' || pregnant.scope !== 'individual') {
    return undefined;
  }
  return findsCycleChild(pregnant, allEvents, PREGNANCY_CLOSERS);
}

export function isEndedPregnancy(pregnant: HealthEvent, allEvents: HealthEvent[]): boolean {
  return Boolean(getPregnancyResolution(pregnant, allEvents));
}

/** Card should use muted “ended” styling when the cycle step is finished. */
export function isCycleStepEnded(event: HealthEvent, allEvents: HealthEvent[]): boolean {
  return isEndedBreeding(event, allEvents) || isEndedPregnancy(event, allEvents);
}

export function cycleResolutionLabel(eventType: string): string {
  switch (normalizeType(eventType)) {
    case 'pregnant':
      return 'Gusama';
    case 'heat observed':
      return 'Heat Observed';
    case 'aborted':
      return 'Kuramburura';
    case 'giving birth':
      return 'Kubyara';
    default:
      return eventType;
  }
}

export function isReproductiveCycleFollowUpDue(event: HealthEvent, allEvents: HealthEvent[], reference = new Date()): boolean {
  return isBreedingAwaitingHeatDecision(event, allEvents, reference) || isOpenPregnancy(event, allEvents);
}

export function emptyEventFields(overrides: Partial<Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'>> = {}): Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'> {
  return {
    scope: 'individual',
    cattleTag: '',
    groupName: '',
    eventDate: '',
    eventType: '',
    symptoms: '',
    diagnosis: '',
    medicine: '',
    dosage: '',
    route: '',
    frequency: '',
    withdrawalDays: 0,
    batchNumber: '',
    technician: '',
    vetName: '',
    vetContact: '',
    followUpDate: '',
    weightKg: 0,
    bodyConditionScore: 0,
    treatmentCost: 0,
    semenUsed: '',
    bullResponsible: '',
    returnHeatDate: '',
    breedingDate: '',
    expectedDeliveryDate: '',
    calfTag: '',
    calfGender: '',
    sourceEventId: '',
    notes: '',
    photoUri: '',
    ...overrides,
  };
}

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
  return later.trim() >= earlier.trim();
}

/** Return-heat window starts ~3 days before estimated return heat. */
export function isReturnHeatWindowOpen(breeding: Pick<HealthEvent, 'returnHeatDate' | 'eventDate'>, reference = new Date()): boolean {
  const anchor = breeding.returnHeatDate?.trim() || '';
  if (!anchor) {
    const days = daysSinceEventDate(breeding.eventDate, reference);
    return days !== null && days >= 18;
  }

  const daysSinceReturn = daysSinceEventDate(anchor, reference);
  if (daysSinceReturn === null) {
    return false;
  }
  // Open from 3 days before return heat onward until resolved.
  return daysSinceReturn >= -3;
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

export function isReproductiveCycleFollowUpDue(event: HealthEvent, allEvents: HealthEvent[], reference = new Date()): boolean {
  return isBreedingAwaitingHeatDecision(event, allEvents, reference);
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

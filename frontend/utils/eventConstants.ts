export const INDIVIDUAL_EVENT_TYPES = [
  { label: 'Kuvurwa', value: 'Treated' },
  { label: 'Kwimisha', value: 'Breeding' },
  { label: 'Gupimwa Ibiro', value: 'Weighed' },
  { label: 'Kubyara', value: 'Giving Birth' },
  { label: 'Gukingirwa', value: 'Vaccinated' },
  { label: 'Gusama', value: 'Pregnant' },
  { label: 'Kuramburura', value: 'Aborted' },
  { label: 'Deworming', value: 'Deworming' },
  { label: 'Hoof Trimming', value: 'Hoof Trimming' },
  { label: 'Pregnancy Diagnosis', value: 'Pregnancy Diagnosis' },
  { label: 'Dry Off', value: 'Dry Off' },
  { label: 'Mastitis', value: 'Mastitis' },
  { label: 'Lameness', value: 'Lameness' },
  { label: 'Heat Observed', value: 'Heat Observed' },
  { label: 'Death', value: 'Death' },
  { label: 'Euthanasia', value: 'Euthanasia' },
] as const;

export const MASS_EVENT_TYPES = ['Vaccinated', 'Herd Spraying', 'Deworming', 'Treated', 'Hoof Trimming'] as const;

export const MEDICATION_ROUTES = ['IM', 'SC', 'IV', 'Oral', 'Topical', 'Pour-on', 'Intramammary'] as const;

export const FEMALE_ONLY_EVENT_TYPES = new Set([
  'Breeding',
  'Pregnant',
  'Aborted',
  'Giving Birth',
  'Pregnancy Diagnosis',
  'Dry Off',
  'Mastitis',
  'Heat Observed',
]);

export function requiresMedicine(eventType: string): boolean {
  return ['Treated', 'Vaccinated', 'Deworming', 'Mastitis', 'Hoof Trimming', 'Lameness'].includes(eventType);
}

export function requiresMedicationDetails(eventType: string): boolean {
  return requiresMedicine(eventType);
}

export function requiresClinicalNotes(eventType: string): boolean {
  return ['Mastitis', 'Lameness'].includes(eventType);
}

export function isReproductiveEvent(eventType: string): boolean {
  return FEMALE_ONLY_EVENT_TYPES.has(eventType);
}

export function normalizeMassEventType(eventType: string): string {
  if (eventType === 'Vaccination') {
    return 'Vaccinated';
  }
  if (eventType === 'Treatment') {
    return 'Treated';
  }
  if (eventType === 'Dewormed') {
    return 'Deworming';
  }
  return eventType;
}

export function allEventTypeFilterOptions(): string[] {
  const individual = INDIVIDUAL_EVENT_TYPES.map((item) => item.value);
  const mass = [...MASS_EVENT_TYPES];
  return [...new Set([...individual, ...mass])].sort();
}

export const INDIVIDUAL_EVENT_TYPE_VALUES = [
  'Treated',
  'Breeding',
  'Giving Birth',
  'Vaccinated',
  'Pregnant',
  'Aborted',
  'Deworming',
  'Hoof Trimming',
  'Death',
] as const;

/** @deprecated Prefer INDIVIDUAL_EVENT_TYPE_VALUES + i18n labels */
export const INDIVIDUAL_EVENT_TYPES = INDIVIDUAL_EVENT_TYPE_VALUES.map((value) => ({
  label: value,
  value,
}));

export const MASS_EVENT_TYPES = ['Vaccinated', 'Herd Spraying', 'Deworming', 'Treated', 'Hoof Trimming'] as const;

export const MEDICATION_ROUTES = ['IM', 'SC', 'IV', 'Oral', 'Topical', 'Pour-on', 'Intramammary'] as const;

export const FEMALE_ONLY_EVENT_TYPES = new Set([
  'Breeding',
  'Pregnant',
  'Aborted',
  'Giving Birth',
]);

const EVENT_TYPE_I18N_KEY: Record<string, string> = {
  Treated: 'eventTypes.treated',
  Breeding: 'eventTypes.breeding',
  'Giving Birth': 'eventTypes.givingBirth',
  Vaccinated: 'eventTypes.vaccinated',
  Pregnant: 'eventTypes.pregnant',
  Aborted: 'eventTypes.aborted',
  Deworming: 'eventTypes.deworming',
  'Hoof Trimming': 'eventTypes.hoofTrimming',
  Death: 'eventTypes.death',
  'Heat Observed': 'eventTypes.heatObserved',
  'Herd Spraying': 'eventTypes.herdSpraying',
  'Pregnancy Diagnosis': 'eventTypes.pregnancyDiagnosis',
  Weighed: 'eventTypes.weighed',
  'Dry Off': 'eventTypes.dryOff',
  Mastitis: 'eventTypes.mastitis',
  Lameness: 'eventTypes.lameness',
  Euthanasia: 'eventTypes.euthanasia',
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function eventTypeLabel(eventType: string, t: TranslateFn): string {
  const normalized = normalizeMassEventType(eventType);
  const key = EVENT_TYPE_I18N_KEY[normalized] ?? EVENT_TYPE_I18N_KEY[eventType];
  if (!key) {
    return eventType;
  }
  const translated = t(key);
  return translated === key ? eventType : translated;
}

export function eventTypeOptionsFromNames(
  names: string[],
  t: TranslateFn,
  extraValue?: string,
): Array<{ label: string; value: string }> {
  const values = [...new Set([...names.map((name) => name.trim()).filter(Boolean), ...(extraValue?.trim() ? [extraValue.trim()] : [])])];
  return values.map((value) => ({
    label: eventTypeLabel(value, t),
    value,
  }));
}

export function individualEventTypeOptions(t: TranslateFn): Array<{ label: string; value: string }> {
  return eventTypeOptionsFromNames([...INDIVIDUAL_EVENT_TYPE_VALUES], t);
}

export function massEventTypeOptions(t: TranslateFn): Array<{ label: string; value: string }> {
  return eventTypeOptionsFromNames([...MASS_EVENT_TYPES], t);
}

export function requiresMedicine(eventType: string): boolean {
  return ['Treated', 'Vaccinated', 'Deworming', 'Hoof Trimming'].includes(eventType);
}

export function requiresMedicationDetails(eventType: string): boolean {
  return requiresMedicine(eventType);
}

export function requiresClinicalNotes(eventType: string): boolean {
  return false;
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

export function allEventTypeFilterOptions(
  t?: TranslateFn,
  managedNames?: string[],
): Array<{ label: string; value: string }> {
  const individual = [...INDIVIDUAL_EVENT_TYPE_VALUES];
  const mass = [...MASS_EVENT_TYPES];
  const managed = managedNames?.map((name) => name.trim()).filter(Boolean) ?? [];
  const values = [...new Set(managed.length > 0 ? managed : [...individual, ...mass])].sort((a, b) =>
    a.localeCompare(b),
  );
  if (!t) {
    return values.map((value) => ({ label: value, value }));
  }
  return values.map((value) => ({ label: eventTypeLabel(value, t), value }));
}

import type { Cattle, HealthEvent } from '../data/farmDatabase';

export const DEFAULT_WEAN_AGE_MONTHS = 6;
export const DEFAULT_HEIFER_BREEDING_AGE_MONTHS = 15;
export const DEFAULT_DRY_OFF_DAYS_BEFORE_CALVING = 60;
export const DEFAULT_LIFECYCLE_ALERT_LEAD_DAYS = 10;
export const LIFECYCLE_NOTIFY_OFFSETS = [10, 3, 1, 0] as const;

export type LifecycleAlertKind = 'weaning' | 'heiferCheck' | 'dryOff' | 'calving';

export type LifecycleAlert = {
  id: string;
  kind: LifecycleAlertKind;
  title: string;
  detail: string;
  cattleTag: string;
  dueDate: Date;
  daysUntil: number;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: string): Date | null {
  if (!value?.trim()) {
    return null;
  }
  const raw = value.trim();
  const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : startOfLocalDay(date);
}

function addCalendarMonths(date: Date, months: number): Date {
  const next = startOfLocalDay(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) {
    next.setDate(0);
  }
  return next;
}

function addCalendarDays(date: Date, days: number): Date {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysUntilDate(today: Date, due: Date): number {
  return Math.round((startOfLocalDay(due).getTime() - startOfLocalDay(today).getTime()) / (1000 * 60 * 60 * 24));
}

function isActiveCattle(animal: Cattle): boolean {
  return animal.status.trim().toLowerCase() === 'active';
}

function stageOf(animal: Cattle): string {
  return animal.stage.trim().toLowerCase();
}

function isFemale(animal: Cattle): boolean {
  return animal.gender.trim().toLowerCase() === 'female';
}

function cattleLabel(animal: Cattle): string {
  const name = animal.name.trim();
  return name ? `${animal.tagNumber} (${name})` : animal.tagNumber;
}

function hasEventType(events: HealthEvent[], cattleTag: string, types: string[]): boolean {
  const wanted = new Set(types.map((type) => type.toLowerCase()));
  return events.some(
    (event) => event.cattleTag.trim() === cattleTag && wanted.has(event.eventType.trim().toLowerCase()),
  );
}

function latestExpectedDelivery(events: HealthEvent[], cattleTag: string): Date | null {
  const ranked = events
    .filter((event) => event.cattleTag.trim() === cattleTag)
    .map((event) => {
      const type = event.eventType.trim().toLowerCase();
      const delivery = parseLocalDate(event.expectedDeliveryDate);
      if (!delivery) {
        return null;
      }
      const rank = type === 'pregnant' || type === 'pregnancy diagnosis' ? 2 : type === 'breeding' ? 1 : 0;
      if (!rank) {
        return null;
      }
      return { delivery, rank, createdAt: event.createdAt };
    })
    .filter((item): item is { delivery: Date; rank: number; createdAt: string } => Boolean(item))
    .sort((a, b) => b.rank - a.rank || b.createdAt.localeCompare(a.createdAt));

  return ranked[0]?.delivery ?? null;
}

function inAlertWindow(daysUntil: number, leadDays: number, windowOnly: boolean): boolean {
  if (windowOnly) {
    return daysUntil <= leadDays;
  }
  return true;
}

export function formatLifecycleDueLabel(daysUntil: number, due: Date): string {
  const dueText = due.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  if (daysUntil < 0) {
    return `Overdue ${dueText}`;
  }
  if (daysUntil === 0) {
    return `Due today · ${dueText}`;
  }
  return `Due ${dueText} · ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

export function lifecycleNotifyDates(due: Date): Date[] {
  return LIFECYCLE_NOTIFY_OFFSETS.map((offset) => addCalendarDays(due, -offset));
}

export function buildLifecycleAlerts(
  herd: Cattle[],
  events: HealthEvent[],
  reference = new Date(),
  options?: { windowOnly?: boolean },
): LifecycleAlert[] {
  const today = startOfLocalDay(reference);
  const leadDays = DEFAULT_LIFECYCLE_ALERT_LEAD_DAYS;
  const windowOnly = options?.windowOnly !== false;
  const alerts: LifecycleAlert[] = [];

  for (const animal of herd) {
    if (!isActiveCattle(animal)) {
      continue;
    }

    const birth = parseLocalDate(animal.dateOfBirth);
    const tag = animal.tagNumber;
    const label = cattleLabel(animal);

    if (birth && stageOf(animal) === 'calf' && !hasEventType(events, tag, ['Weaning'])) {
      const due = addCalendarMonths(birth, DEFAULT_WEAN_AGE_MONTHS);
      const daysUntil = daysUntilDate(today, due);
      if (inAlertWindow(daysUntil, leadDays, windowOnly)) {
        alerts.push({
          id: `weaning:${animal.id}`,
          kind: 'weaning',
          title: 'Weaning due',
          detail: `${label} · stop milk, increase feed`,
          cattleTag: tag,
          dueDate: due,
          daysUntil,
        });
      }
    }

    if (
      birth &&
      isFemale(animal) &&
      ['weaner', 'heifer'].includes(stageOf(animal)) &&
      !hasEventType(events, tag, ['Breeding', 'Pregnant', 'Pregnancy Diagnosis', 'Giving Birth'])
    ) {
      const due = addCalendarMonths(birth, DEFAULT_HEIFER_BREEDING_AGE_MONTHS);
      const daysUntil = daysUntilDate(today, due);
      if (inAlertWindow(daysUntil, leadDays, windowOnly)) {
        alerts.push({
          id: `heiferCheck:${animal.id}`,
          kind: 'heiferCheck',
          title: 'Check heifer for breeding',
          detail: label,
          cattleTag: tag,
          dueDate: due,
          daysUntil,
        });
      }
    }

    if (!isFemale(animal) || hasEventType(events, tag, ['Giving Birth', 'Aborted'])) {
      continue;
    }

    const delivery = latestExpectedDelivery(events, tag);
    if (!delivery) {
      continue;
    }

    const dryOffDue = addCalendarDays(delivery, -DEFAULT_DRY_OFF_DAYS_BEFORE_CALVING);
    const dryDays = daysUntilDate(today, dryOffDue);
    if (!hasEventType(events, tag, ['Dry Off']) && inAlertWindow(dryDays, leadDays, windowOnly)) {
      alerts.push({
        id: `dryOff:${animal.id}`,
        kind: 'dryOff',
        title: 'Dry-off due',
        detail: `${label} · stop milking before calving`,
        cattleTag: tag,
        dueDate: dryOffDue,
        daysUntil: dryDays,
      });
    }

    const calvingDays = daysUntilDate(today, delivery);
    if (inAlertWindow(calvingDays, leadDays, windowOnly)) {
      alerts.push({
        id: `calving:${animal.id}`,
        kind: 'calving',
        title: 'Calving due',
        detail: label,
        cattleTag: tag,
        dueDate: delivery,
        daysUntil: calvingDays,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntil - b.daysUntil || a.cattleTag.localeCompare(b.cattleTag));
}

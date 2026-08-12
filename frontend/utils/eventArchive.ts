import type { HealthEvent } from '../data/farmDatabase';

export const EVENT_ARCHIVE_AFTER_DAYS = 3;

export function isBreedingEvent(event: Pick<HealthEvent, 'eventType'>): boolean {
  return event.eventType.trim().toLowerCase() === 'breeding';
}

export function daysSinceEventDate(eventDate: string, reference = new Date()): number | null {
  if (!eventDate?.trim()) {
    return null;
  }

  // Accept YYYY-MM-DD or full datetime (e.g. returnHeatDate with time).
  const dateOnly = eventDate.trim().slice(0, 10);
  const eventDay = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(eventDay.getTime())) {
    return null;
  }

  const today = new Date(reference);
  today.setHours(0, 0, 0, 0);
  eventDay.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24));
}

/** Events older than 3 days go to archive, except Kwimisha (Breeding). */
export function isEventArchived(event: Pick<HealthEvent, 'eventType' | 'eventDate'>, reference = new Date()): boolean {
  if (isBreedingEvent(event)) {
    return false;
  }

  const daysSince = daysSinceEventDate(event.eventDate, reference);
  if (daysSince === null) {
    return false;
  }

  return daysSince > EVENT_ARCHIVE_AFTER_DAYS;
}

export function isActiveEvent(event: Pick<HealthEvent, 'eventType' | 'eventDate'>, reference = new Date()): boolean {
  return !isEventArchived(event, reference);
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getCattle, getHealthEvents, type HealthEvent } from './farmDatabase';
import { isActiveEvent } from '../utils/eventArchive';
import {
  buildLifecycleAlerts,
  formatLifecycleDueLabel,
  LIFECYCLE_NOTIFY_OFFSETS,
  type LifecycleAlert,
} from '../utils/lifecycleAlerts';
import { isCycleStepEnded } from '../utils/reproductiveCycle';
import { getRemindersEnabled } from './reminderPrefs';

const CHANNEL_ID = 'inka-reminders';
const FOLLOWUP_PREFIX = 'inka-followup-';
const WITHDRAWAL_PREFIX = 'inka-withdrawal-';
const LIFECYCLE_PREFIX = 'inka-lifecycle-';
const DIGEST_ID = 'inka-followup-digest';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type FarmAlert = {
  id: string;
  kind: 'followUp' | 'withdrawal' | 'weaning' | 'heiferCheck' | 'dryOff' | 'calving';
  title: string;
  detail: string;
  eventId: string;
  cattleTag: string;
  dueLabel: string;
};

function parseLocalDate(value: string): Date | null {
  if (!value?.trim()) {
    return null;
  }
  const raw = value.trim();
  const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function subjectLabel(event: HealthEvent): string {
  if (event.cattleTag?.trim()) {
    return event.cattleTag.trim();
  }
  if (event.groupName?.trim()) {
    return event.groupName.trim();
  }
  return event.scope === 'mass' ? 'Mass event' : 'Herd';
}

export function withdrawalEndsOn(event: HealthEvent): Date | null {
  if (!event.withdrawalDays || event.withdrawalDays <= 0) {
    return null;
  }
  const start = parseLocalDate(event.eventDate);
  if (!start) {
    return null;
  }
  return startOfLocalDay(addDays(start, Math.ceil(event.withdrawalDays)));
}

export function isWithdrawalEndingSoon(event: HealthEvent, withinDays = 2): boolean {
  const ends = withdrawalEndsOn(event);
  if (!ends) {
    return false;
  }
  const today = startOfLocalDay(new Date());
  const horizon = addDays(today, withinDays);
  return ends.getTime() >= today.getTime() && ends.getTime() <= horizon.getTime();
}

export function buildFarmAlerts(events: HealthEvent[]): FarmAlert[] {
  const active = events.filter((item) => isActiveEvent(item));
  const alerts: FarmAlert[] = [];

  for (const event of active) {
    // Alerts = dated follow-ups + milk withdrawal only.
    // Open Kwimisha / Gusama cycle steps belong on Events → Follow-up, not the bell.
    const due = parseLocalDate(event.followUpDate);
    const datedFollowUpDue =
      Boolean(due) && !isCycleStepEnded(event, events) && due!.getTime() <= Date.now();

    if (datedFollowUpDue) {
      alerts.push({
        id: `followUp:${event.id}`,
        kind: 'followUp',
        title: `${event.eventType || 'Event'} follow-up`,
        detail: subjectLabel(event),
        eventId: event.id,
        cattleTag: event.cattleTag,
        dueLabel: `Due ${formatShortDate(due!)}`,
      });
    } else if (isWithdrawalEndingSoon(event)) {
      const ends = withdrawalEndsOn(event)!;
      alerts.push({
        id: `withdrawal:${event.id}`,
        kind: 'withdrawal',
        title: 'Milk withdrawal ending',
        detail: `${subjectLabel(event)} · ${event.medicine || event.eventType}`,
        eventId: event.id,
        cattleTag: event.cattleTag,
        dueLabel: `Ends ${formatShortDate(ends)}`,
      });
    }
  }

  return alerts.sort((a, b) => a.dueLabel.localeCompare(b.dueLabel));
}

export async function ensureReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Farm reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#008B8B',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

async function cancelInkaReminderNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) =>
          item.identifier.startsWith(FOLLOWUP_PREFIX) ||
          item.identifier.startsWith(WITHDRAWAL_PREFIX) ||
          item.identifier.startsWith(LIFECYCLE_PREFIX) ||
          item.identifier === DIGEST_ID,
      )
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

function atEightAm(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0, 0);
}

async function scheduleFollowUpNotification(event: HealthEvent): Promise<void> {
  const due = parseLocalDate(event.followUpDate);
  if (!due) {
    return;
  }
  const fireAt = atEightAm(startOfLocalDay(due));
  if (fireAt.getTime() <= Date.now()) {
    // Already due/overdue — surface on Dashboard only (avoid re-notify spam on every sync).
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: `${FOLLOWUP_PREFIX}${event.id}`,
    content: {
      title: 'Follow-up due',
      body: `${event.eventType || 'Event'} — ${subjectLabel(event)}`,
      data: { type: 'followUp', eventId: event.id, cattleTag: event.cattleTag },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

async function scheduleLifecycleNotification(alert: LifecycleAlert): Promise<void> {
  await Promise.all(
    LIFECYCLE_NOTIFY_OFFSETS.map(async (offset) => {
      const fireDay = new Date(alert.dueDate);
      fireDay.setDate(fireDay.getDate() - offset);
      const fireAt = atEightAm(startOfLocalDay(fireDay));
      if (fireAt.getTime() <= Date.now()) {
        return;
      }
      await Notifications.scheduleNotificationAsync({
        identifier: `${LIFECYCLE_PREFIX}${alert.kind}-${alert.cattleTag}-${offset}`,
        content: {
          title: alert.title,
          body: offset === 0 ? `${alert.detail} · due today` : `${alert.detail} · ${offset} days left`,
          data: { type: alert.kind, cattleTag: alert.cattleTag },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
    }),
  );
}

async function scheduleWithdrawalNotification(event: HealthEvent): Promise<void> {
  const ends = withdrawalEndsOn(event);
  if (!ends) {
    return;
  }
  const fireAt = atEightAm(ends);
  const now = Date.now();
  if (fireAt.getTime() <= now) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: `${WITHDRAWAL_PREFIX}${event.id}`,
    content: {
      title: 'Milk withdrawal ending',
      body: `${subjectLabel(event)} · ${event.medicine || event.eventType || 'Treatment'}`,
      data: { type: 'withdrawal', eventId: event.id, cattleTag: event.cattleTag },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

function toLifecycleFarmAlerts(items: LifecycleAlert[]): FarmAlert[] {
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    detail: item.detail,
    eventId: '',
    cattleTag: item.cattleTag,
    dueLabel: formatLifecycleDueLabel(item.daysUntil, item.dueDate),
  }));
}

/** Cancel all Inka reminder notifications and reschedule from current events when enabled. */
export async function syncFarmReminders(events?: HealthEvent[]): Promise<FarmAlert[]> {
  const [list, herd] = await Promise.all([events ? Promise.resolve(events) : getHealthEvents(), getCattle()]);
  const lifecycleWindow = buildLifecycleAlerts(herd, list, new Date(), { windowOnly: true });
  const alerts = [...buildFarmAlerts(list), ...toLifecycleFarmAlerts(lifecycleWindow)].sort((a, b) =>
    a.dueLabel.localeCompare(b.dueLabel),
  );

  if (Platform.OS === 'web') {
    return alerts;
  }

  const enabled = await getRemindersEnabled();
  await cancelInkaReminderNotifications();

  if (!enabled) {
    return alerts;
  }

  const granted = await ensureReminderPermissions();
  if (!granted) {
    return alerts;
  }

  const active = list.filter((item) => isActiveEvent(item));
  const upcomingFollowUps = active.filter((item) => item.followUpDate?.trim());
  const endingWithdrawals = active.filter((item) => {
    const ends = withdrawalEndsOn(item);
    if (!ends) {
      return false;
    }
    return ends.getTime() > Date.now();
  });
  const lifecycleSchedule = buildLifecycleAlerts(herd, list, new Date(), { windowOnly: false });

  await Promise.all([
    ...upcomingFollowUps.slice(0, 40).map((event) => scheduleFollowUpNotification(event)),
    ...endingWithdrawals.slice(0, 40).map((event) => scheduleWithdrawalNotification(event)),
    ...lifecycleSchedule.slice(0, 40).map((item) => scheduleLifecycleNotification(item)),
  ]);

  return alerts;
}

export async function clearFarmReminders(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await cancelInkaReminderNotifications();
}

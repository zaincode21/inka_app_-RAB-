import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  createHealthEvent,
  createMilkRecord,
  uploadAttachment,
  type HealthEvent,
  type MilkRecord,
} from './farmDatabase';

const QUEUE_KEY = 'inka.offline.queue.v1';

export type MilkCreatePayload = Omit<MilkRecord, 'id' | 'createdAt' | 'recordedBy'> & {
  createMilkSale?: boolean;
  paymentMethod?: string;
};

export type EventCreatePayload = Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'>;

export type QueuedMilkItem = {
  id: string;
  kind: 'milkCreate';
  createdAt: string;
  payload: MilkCreatePayload;
};

export type QueuedEventItem = {
  id: string;
  kind: 'eventCreate';
  createdAt: string;
  payload: EventCreatePayload;
  /** Local device URI to upload after the event syncs. */
  localPhotoUri?: string;
};

export type OfflineQueueItem = QueuedMilkItem | QueuedEventItem;

export type QueueResult<T = unknown> =
  | { status: 'saved'; data: T }
  | { status: 'queued'; item: OfflineQueueItem };

function newId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isRetriableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('internet') ||
    message.includes('offline') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('socket') ||
    // Empty/invalid JSON after a broken connection
    message.includes('unexpected end of json') ||
    message.includes('json parse')
  );
}

export async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) {
    return true;
  }
  if (state.isInternetReachable === false) {
    return true;
  }
  return false;
}

async function readQueue(): Promise<OfflineQueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  return readQueue();
}

export async function getOfflineQueueCount(): Promise<number> {
  return (await readQueue()).length;
}

export async function enqueueMilkCreate(payload: MilkCreatePayload): Promise<QueuedMilkItem> {
  const item: QueuedMilkItem = {
    id: newId(),
    kind: 'milkCreate',
    createdAt: new Date().toISOString(),
    payload,
  };
  const queue = await readQueue();
  queue.push(item);
  await writeQueue(queue);
  return item;
}

export async function enqueueEventCreate(
  payload: EventCreatePayload,
  localPhotoUri?: string,
): Promise<QueuedEventItem> {
  const item: QueuedEventItem = {
    id: newId(),
    kind: 'eventCreate',
    createdAt: new Date().toISOString(),
    payload: {
      ...payload,
      // Keep local path for display until upload; clear remote-looking empties
      photoUri: '',
    },
    localPhotoUri: localPhotoUri?.trim() || payload.photoUri?.trim() || undefined,
  };
  const queue = await readQueue();
  queue.push(item);
  await writeQueue(queue);
  return item;
}

async function removeQueueItem(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

/** Create milk now, or queue when offline / network fails. Edits are not queued. */
export async function createMilkRecordOrQueue(payload: MilkCreatePayload): Promise<QueueResult<MilkRecord>> {
  if (await isDeviceOffline()) {
    const item = await enqueueMilkCreate(payload);
    return { status: 'queued', item };
  }
  try {
    const data = await createMilkRecord(payload);
    return { status: 'saved', data };
  } catch (error) {
    if (isRetriableNetworkError(error) || (await isDeviceOffline())) {
      const item = await enqueueMilkCreate(payload);
      return { status: 'queued', item };
    }
    throw error;
  }
}

/** Create individual event now, or queue when offline / network fails. Edits are not queued. */
export async function createHealthEventOrQueue(
  payload: EventCreatePayload,
): Promise<QueueResult<HealthEvent>> {
  const localPhoto =
    payload.photoUri && !/^https?:\/\//i.test(payload.photoUri) ? payload.photoUri.trim() : '';
  const onlinePayload = localPhoto ? { ...payload, photoUri: '' } : payload;

  if (await isDeviceOffline()) {
    const item = await enqueueEventCreate(onlinePayload, localPhoto || undefined);
    return { status: 'queued', item };
  }
  try {
    const data = await createHealthEvent(onlinePayload);
    if (localPhoto && data.id) {
      try {
        const uploaded = await uploadAttachment({
          uri: localPhoto,
          ownerType: 'healthEvent',
          healthEventId: data.id,
          label: 'Event photo',
        });
        return { status: 'saved', data: { ...data, photoUri: uploaded.uri } };
      } catch {
        // Event saved; photo can be re-attached later.
        return { status: 'saved', data };
      }
    }
    return { status: 'saved', data };
  } catch (error) {
    if (isRetriableNetworkError(error) || (await isDeviceOffline())) {
      const item = await enqueueEventCreate(onlinePayload, localPhoto || undefined);
      return { status: 'queued', item };
    }
    throw error;
  }
}

export type FlushResult = {
  synced: number;
  remaining: number;
  failed: number;
};

let flushing = false;

/** Replay queued creates in order. Stops on first hard (non-network) failure for that item (drops it). */
export async function flushOfflineQueue(): Promise<FlushResult> {
  if (flushing) {
    const remaining = await getOfflineQueueCount();
    return { synced: 0, remaining, failed: 0 };
  }
  if (await isDeviceOffline()) {
    const remaining = await getOfflineQueueCount();
    return { synced: 0, remaining, failed: 0 };
  }

  flushing = true;
  let synced = 0;
  let failed = 0;
  try {
    let queue = await readQueue();
    while (queue.length > 0) {
      if (await isDeviceOffline()) {
        break;
      }
      const [item, ...rest] = queue;
      try {
        if (item.kind === 'milkCreate') {
          await createMilkRecord(item.payload);
        } else {
          const created = await createHealthEvent(item.payload);
          if (item.localPhotoUri && created.id) {
            try {
              await uploadAttachment({
                uri: item.localPhotoUri,
                ownerType: 'healthEvent',
                healthEventId: created.id,
                label: 'Event photo',
              });
            } catch {
              // Event synced; photo optional.
            }
          }
        }
        await removeQueueItem(item.id);
        synced += 1;
        queue = rest;
      } catch (error) {
        if (isRetriableNetworkError(error) || (await isDeviceOffline())) {
          break;
        }
        // Permanent failure (validation etc.) — drop so the queue is not blocked forever.
        await removeQueueItem(item.id);
        failed += 1;
        queue = rest;
      }
    }
  } finally {
    flushing = false;
  }

  const remaining = await getOfflineQueueCount();
  return { synced, remaining, failed };
}

/** Subscribe to reconnect and flush. Returns unsubscribe. */
export function subscribeOfflineQueueFlush(onChange?: (count: number) => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    if (!online) {
      void getOfflineQueueCount().then((count) => onChange?.(count));
      return;
    }
    void flushOfflineQueue().then(async (result) => {
      onChange?.(result.remaining);
    });
  });
  return unsubscribe;
}

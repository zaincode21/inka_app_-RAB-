import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'inka.reminders.enabled';

export async function getRemindersEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  if (raw == null) {
    return true;
  }
  return raw === '1' || raw === 'true';
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, enabled ? '1' : '0');
}

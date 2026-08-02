import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'rw';

const LANGUAGE_KEY = 'inka.language';

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (raw === 'en' || raw === 'rw') {
    return raw;
  }
  return null;
}

export async function setStoredLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

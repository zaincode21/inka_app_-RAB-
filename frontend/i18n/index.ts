import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import rw from './locales/rw.json';
import { getStoredLanguage, setStoredLanguage, type AppLanguage } from '../data/languagePrefs';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'rw'];

function deviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? 'en';
  if (code === 'rw' || code.startsWith('rw')) {
    return 'rw';
  }
  return 'en';
}

let readyPromise: Promise<typeof i18n> | null = null;

export function initI18n() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const stored = await getStoredLanguage();
      const lng = stored ?? deviceLanguage();
      if (!i18n.isInitialized) {
        await i18n.use(initReactI18next).init({
          resources: {
            en: { translation: en },
            rw: { translation: rw },
          },
          lng,
          fallbackLng: 'en',
          interpolation: { escapeValue: false },
          compatibilityJSON: 'v4',
        });
      } else if (i18n.language !== lng) {
        await i18n.changeLanguage(lng);
      }
      return i18n;
    })();
  }
  return readyPromise;
}

export async function changeAppLanguage(language: AppLanguage) {
  await setStoredLanguage(language);
  await i18n.changeLanguage(language);
}

export default i18n;

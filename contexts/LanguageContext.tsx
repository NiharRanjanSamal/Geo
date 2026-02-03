import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { I18n } from 'i18n-js';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ta from '@/locales/ta.json';

const LOCALE_STORAGE_KEY = 'app_locale';

export type LocaleCode = 'en' | 'hi' | 'ta';

const translations = { en, hi, ta };
const i18n = new I18n(translations);
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

type LanguageContextValue = {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => Promise<void>;
  t: (key: string) => string;
  localeName: (code: LocaleCode) => string;
};

const defaultLocale: LocaleCode = 'en';

const localeNames: Record<LocaleCode, string> = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

async function getStoredLocale(): Promise<LocaleCode | null> {
  try {
    const stored = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'hi' || stored === 'ta')) {
      return stored as LocaleCode;
    }
  } catch (_) {}
  return null;
}

function getDeviceLocale(): LocaleCode {
  try {
    const locales = Localization.getLocales();
    const preferred = locales?.[0]?.languageCode;
    if (preferred === 'hi') return 'hi';
    if (preferred === 'ta') return 'ta';
  } catch (_) {}
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(defaultLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getStoredLocale();
      const next = stored ?? getDeviceLocale();
      i18n.locale = next;
      setLocaleState(next);
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (code: LocaleCode) => {
    try {
      await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, code);
      i18n.locale = code;
      setLocaleState(code);
    } catch (e) {
      console.error('Failed to save locale:', e);
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      if (!ready) return key;
      const value = i18n.t(key);
      return typeof value === 'string' ? value : key;
    },
    [locale, ready]
  );

  const localeName = useCallback((code: LocaleCode) => localeNames[code], []);

  const value: LanguageContextValue = { locale, setLocale, t, localeName };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

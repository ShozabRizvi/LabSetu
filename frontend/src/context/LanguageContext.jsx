import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

const dictionaries = {
  en: enTranslations,
  hi: hiTranslations
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('labsetu_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('labsetu_language', newLang);
    } catch {
      // ignore storage error
    }
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
  }, [lang, setLang]);

  const isHindi = lang === 'hi';

  // Helper to safely resolve nested keys like 'support.pageTitle'
  const getNestedValue = (obj, path) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return curr;
  };

  const t = useCallback((key, fallback) => {
    if (!key) return '';
    const activeDict = dictionaries[lang] || dictionaries.en;
    const val = getNestedValue(activeDict, key);
    if (val !== undefined && val !== null && val !== '') return val;

    // Fallback to English if Hindi key is missing
    if (lang !== 'en') {
      const enVal = getNestedValue(dictionaries.en, key);
      if (enVal !== undefined && enVal !== null && enVal !== '') return enVal;
    }

    // Fallback to explicit fallback string or key itself
    if (fallback !== undefined) return fallback;
    return key;
  }, [lang]);

  const i18n = useMemo(() => ({
    language: lang,
    changeLanguage: setLang
  }), [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isHindi, t, i18n }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      isHindi: false,
      t: (k, fb) => fb || k,
      i18n: { language: 'en', changeLanguage: () => {} }
    };
  }
  return context;
}

export const useTranslation = useLanguage;

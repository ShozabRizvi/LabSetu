import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('labsetu_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('labsetu_language', newLang);
    } catch {
      // ignore storage error
    }
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
  };

  const isHindi = lang === 'hi';

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isHindi }}>
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
      isHindi: false
    };
  }
  return context;
}

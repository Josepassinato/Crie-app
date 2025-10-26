import React, { createContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../lib/translations';
import { Language } from '../types';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'Português',
  setLanguage: () => {},
  t: () => '',
});

const getInitialLanguage = (): Language => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'Español';
    if (browserLang === 'en') return 'English';
    return 'Português';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

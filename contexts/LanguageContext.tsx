import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { translations } from '../lib/translations.ts';
import { Language } from '../types.ts';

// Updated type to accept replacements
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'Português',
  setLanguage: () => {},
  t: () => '',
});

const getInitialLanguage = (): Language => {
    // Force Portuguese as default since translations are complete only in Portuguese
    return 'Português';
    // Uncomment below to enable automatic language detection
    // const browserLang = navigator.language.split('-')[0];
    // if (browserLang === 'es') return 'Español';
    // if (browserLang === 'en') return 'English';
    // return 'Português';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('appLanguage');
    if (storedLanguage && ['Português', 'English', 'Español'].includes(storedLanguage)) {
      setLanguage(storedLanguage as Language);
    }
  }, []);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    if (replacements) {
      for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      }
    }
    return translation;
  }, [language]);

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
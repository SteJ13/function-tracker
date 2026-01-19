import React, { createContext, useContext, useState } from 'react';
import { translations } from '@utils/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // 'en' | 'ta'

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

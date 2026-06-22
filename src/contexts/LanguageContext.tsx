import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ar } from '../translations/ar';
import { en } from '../translations/en';
import type { Translations } from '../translations/ar';

type Lang = 'ar' | 'en';

type LanguageContextType = {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'ar';
  });

  const t = lang === 'ar' ? ar : en;

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.title = lang === 'ar' ? 'وَرَق — منصة الكتب والمراجعات' : 'Waraq — Book Review Platform';
  }, [lang, t.dir]);

  const toggleLang = () => setLang(l => (l === 'ar' ? 'en' : 'ar'));

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}

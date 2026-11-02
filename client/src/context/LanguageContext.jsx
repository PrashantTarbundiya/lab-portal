import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../i18n/en';
import te from '../i18n/te';
import hi from '../i18n/hi';

const LanguageContext = createContext(null);

const LANGUAGES = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिन्दी',
};

const DICTIONARIES = { en, te, hi };

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = getCookie('lab_lang');
    return saved && LANGUAGES[saved] ? saved : 'en';
  });

  const setLang = useCallback((newLang) => {
    if (LANGUAGES[newLang]) {
      setLangState(newLang);
      setCookie('lab_lang', newLang);
      document.documentElement.lang = newLang;
      document.body.className = document.body.className
        .replace(/lang-\w+/g, '')
        .trim();
      if (newLang !== 'en') {
        document.body.classList.add(`lang-${newLang}`);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang !== 'en') {
      document.body.classList.add(`lang-${lang}`);
      // Load Indic fonts dynamically
      const fontName =
        lang === 'te' ? 'Noto+Sans+Telugu' : 'Noto+Sans+Devanagari';
      const linkId = `font-${lang}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [lang]);

  const t = useCallback(
    (key) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.en;
      return dict[key] ?? DICTIONARIES.en[key] ?? key;
    },
    [lang]
  );

  const value = {
    lang,
    setLang,
    t,
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

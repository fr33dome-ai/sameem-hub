/**
 * i18next setup with EN/AR. Used by client components.
 * Server components read language from cookies and pass strings directly.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: typeof window !== 'undefined' ? (document.documentElement.lang || 'en') : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;

export function isRTL(lang: string) { return lang === 'ar'; }

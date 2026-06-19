import { translations } from './translations.js';

const LANGUAGE_KEY = 'first-tackle-language';
const supportedLanguages = ['en', 'uk'];

let currentLanguage = detectInitialLanguage();

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  currentLanguage = supportedLanguages.includes(language) ? language : 'en';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  }
  return currentLanguage;
}

export function toggleLanguage() {
  return setLanguage(currentLanguage === 'en' ? 'uk' : 'en');
}

export function t(key, params = {}) {
  const value = translations[currentLanguage]?.[key] ?? translations.en[key] ?? key;
  return interpolate(value, params);
}

export function translateEntry(entry) {
  if (typeof entry === 'string') {
    return entry;
  }

  if (!entry || typeof entry !== 'object') {
    return '';
  }

  return t(entry.key, localizeParams(entry.params ?? {}));
}

function detectInitialLanguage() {
  const savedLanguage = typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null;
  if (supportedLanguages.includes(savedLanguage)) {
    return savedLanguage;
  }

  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

function interpolate(value, params) {
  return value.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

function localizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (key.endsWith('Key') && typeof value === 'string') {
        return [key.replace(/Key$/, ''), t(value)];
      }

      return [key, value];
    }),
  );
}

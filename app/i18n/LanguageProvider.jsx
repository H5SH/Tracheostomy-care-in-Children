/**
 * App-wide language state and string lookup.
 *
 * Urdu is the default. The chosen language is held in memory only — there is no storage
 * dependency in this project, so the app opens in the default language every launch and the
 * welcome screen is where you switch.
 *
 * Urdu is right-to-left. Rather than calling `I18nManager.forceRTL`, which only takes effect
 * after an app restart, direction is applied per-component through `textStyle` and `rowDirection`
 * below. That switches instantly when the user taps a language.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  defaultLanguageKey,
  fallbackLanguageKey,
  getLanguage,
  languages,
  uiStrings,
} from '../data/catalog';

const LanguageContext = createContext(null);

/** Replaces `{name}` placeholders, e.g. t('welcome.feature.procedures', { count: 9 }). */
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

export function LanguageProvider({ children }) {
  const [languageKey, setLanguageKey] = useState(defaultLanguageKey);

  const language = getLanguage(languageKey);
  const isRTL = language.direction === 'rtl';

  const t = useCallback(
    (key, vars) => {
      const value =
        uiStrings[languageKey]?.[key] ?? uiStrings[fallbackLanguageKey]?.[key] ?? key;

      if (__DEV__ && !uiStrings[languageKey]?.[key]) {
        console.warn(`[i18n] Missing "${key}" for language "${languageKey}".`);
      }
      return interpolate(value, vars);
    },
    [languageKey]
  );

  const value = useMemo(
    () => ({
      language,
      languageKey,
      languages,
      setLanguage: setLanguageKey,
      t,
      isRTL,
      /** Spread onto <Text> so Urdu renders right-to-left. */
      textStyle: {
        textAlign: isRTL ? 'right' : 'left',
        writingDirection: isRTL ? 'rtl' : 'ltr',
      },
      /** Spread onto a row so leading/trailing content mirrors in Urdu. */
      rowDirection: isRTL ? 'row-reverse' : 'row',
    }),
    [language, languageKey, t, isRTL]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useLanguage must be used inside <LanguageProvider>.');
  }
  return value;
}

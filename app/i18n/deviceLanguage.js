/**
 * Picks the language the app opens in, from the device's own language settings.
 *
 * `expo-localization` is the source of truth. It reads `NSLocale.preferredLanguages` on iOS and
 * the `LocaleList` on Android — the user's *preference list*, in order.
 *
 * An earlier version of this read `Intl.DateTimeFormat().resolvedOptions().locale` instead and
 * silently always chose English. Two reasons, both worth keeping in mind before changing this:
 *
 *  1. `Intl` reports the locale the app *resolved to*, not the one the user asked for. On iOS an
 *     app is only handed a language it declares in its bundle, so inside Expo Go — which ships a
 *     fixed set of localizations — a phone set to Urdu still reports `en`. Region settings leak
 *     in too, giving tags like `en-PK` for exactly the user we most want to detect.
 *  2. It returns one locale. People list several, and the second or third entry is often the one
 *     the app can actually serve, so the whole list has to be walked in order.
 *
 * Matching is on the primary subtag only: `ur-PK`, `ur-IN` and bare `ur` all resolve to Urdu.
 * Region is deliberately ignored — the recordings are not region-specific.
 */
import { getLocales } from 'expo-localization';

/** `ur_PK` / `ur-PK` / `UR` → `ur`. Returns `undefined` for anything unusable. */
function primarySubtag(tag) {
  if (typeof tag !== 'string') return undefined;
  const primary = tag.trim().replace(/_/g, '-').split('-')[0];
  return primary ? primary.toLowerCase() : undefined;
}

/**
 * The device's preferred languages, best first, as primary subtags.
 *
 * `getLocales()` throws in environments without the native module rather than returning empty,
 * hence the guard — a detection failure must fall back to `defaultLanguage`, never crash the
 * app on launch.
 */
function preferredSubtags() {
  try {
    return (getLocales() ?? [])
      .map((locale) => primarySubtag(locale?.languageCode ?? locale?.languageTag))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * The key of the first device language this app has text for, or `undefined` when it speaks
 * none of them — the caller then falls back to `defaultLanguage`.
 *
 * @param {Array<{ key: string, locales?: string[] }>} languages from `content.json`
 */
export function detectLanguageKey(languages) {
  const preferred = preferredSubtags();

  // Ordered by the user's preference, not by the order languages happen to sit in content.json:
  // someone whose list is [Arabic, English] must get Arabic even though English is declared first.
  for (const subtag of preferred) {
    const match = languages.find((language) =>
      (language.locales ?? []).some((locale) => primarySubtag(locale) === subtag)
    );
    if (match) {
      if (__DEV__) {
        console.log(`[i18n] device prefers [${preferred.join(', ')}] -> "${match.key}"`);
      }
      return match.key;
    }
  }

  if (__DEV__) {
    console.log(
      preferred.length
        ? `[i18n] device prefers [${preferred.join(', ')}], none supported -> default`
        : '[i18n] no device locale available -> default'
    );
  }
  return undefined;
}

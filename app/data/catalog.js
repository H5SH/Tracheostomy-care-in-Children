/**
 * Reads `content.json` and turns it into the shapes the screens need.
 *
 * Everything here is derived — adding a language or a video means editing `content.json` and
 * dropping files into `asset-packs/`, never editing code. `require.context` is what makes that
 * work: Metro statically discovers every image and video under the two directories below, so
 * new files are picked up without a matching `require()` call.
 *
 * See README.md > "Adding a language" and "Adding a video".
 */
import content from './content.json';

/** Every image in `assets/` (not recursive). Keys look like `./handHygiene.jpg`. */
const imageContext = require.context('../../assets', false, /\.(jpe?g|png)$/);

export const languages = content.languages;
export const defaultLanguageKey = content.defaultLanguage;
export const fallbackLanguageKey = content.fallbackLanguage;

export function getLanguage(key) {
  return languages.find((language) => language.key === key) ?? languages[0];
}

/** Picks `field[languageKey]`, falling back to the fallback language, then to any value present. */
function localize(field, languageKey) {
  if (!field) return undefined;
  return field[languageKey] ?? field[fallbackLanguageKey] ?? Object.values(field)[0];
}

function resolveImage(fileName) {
  try {
    return imageContext(`./${fileName}`);
  } catch {
    if (__DEV__) {
      console.warn(`[catalog] Missing image "assets/${fileName}" referenced by content.json.`);
    }
    return undefined;
  }
}

/**
 * Procedures that have a video in this language, localized and ready to render.
 * A procedure with no recording in the chosen language is left out entirely — that is why
 * "Introduction" does not appear in Urdu.
 */
export function proceduresFor(languageKey) {
  const language = getLanguage(languageKey);

  return content.procedures
    .filter((procedure) => Boolean(procedure.videos?.[language.key]))
    .map((procedure) => ({
      id: procedure.id,
      title: localize(procedure.title, language.key),
      description: localize(procedure.description, language.key),
      image: resolveImage(procedure.image),
      video: {
        pack: language.assetPack,
        path: `${language.videoDir}/${procedure.videos[language.key]}`,
      },
    }));
}

/** A single procedure in a given language, or `null` when it has no video in that language. */
export function procedureFor(procedureId, languageKey) {
  return proceduresFor(languageKey).find((procedure) => procedure.id === procedureId) ?? null;
}

export function resourcesFor(languageKey) {
  return content.resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    url: resource.url,
    description: localize(resource.description, languageKey),
  }));
}

export const uiStrings = content.ui;

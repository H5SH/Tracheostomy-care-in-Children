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
 * Every procedure this language can show, localized and ready to render.
 *
 * Picture and narration are separate files: one silent video per procedure, and one audio file per
 * language per procedure. That is why a language costs kilobytes rather than another copy of the
 * video, and why one language's narration can be replaced without rebuilding anything else.
 *
 * **A procedure with no narration in the chosen language is left out entirely.** An earlier
 * version played the English recording instead, which meant an Urdu user tapping the first card —
 * the introduction, the one procedure Urdu has never had a recording for — got English narration
 * with no warning. Eight procedures that all speak Urdu beat nine where one surprises you. It is
 * also what the app did before the other languages were added.
 */
export function proceduresFor(languageKey) {
  const language = getLanguage(languageKey);

  return content.procedures
    .filter((procedure) => procedure.video && (procedure.audio ?? []).includes(language.key))
    .map((procedure) => ({
      id: procedure.id,
      title: localize(procedure.title, language.key),
      description: localize(procedure.description, language.key),
      image: resolveImage(procedure.image),
      video: {
        pack: content.video.assetPack,
        path: `${content.video.dir}/${procedure.video}`,
      },
      audio: {
        pack: content.audio.assetPack,
        path: `${content.audio.dir}/${language.key}/${procedure.id}.m4a`,
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

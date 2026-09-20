#!/usr/bin/env node
/**
 * Validates `app/data/content.json` against what is actually on disk.
 *
 * Run it after editing content.json or adding videos:  npm run check:content
 *
 * Checks:
 *   - every language has an asset pack directory, and app.json declares that pack
 *   - every video referenced in content.json exists in the right place
 *   - every video file on disk is referenced (catches typos and stray files that would
 *     otherwise bloat the build)
 *   - every procedure image exists in assets/
 *   - every UI string key exists in every language
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

const errors = [];
const warnings = [];

/* ----------------------------------- languages ---------------------------------- */

const declaredPacks = new Set(
  (appJson.expo.plugins ?? [])
    .filter((p) => Array.isArray(p) && p[0] === './plugins/withAndroidAssetPacks')
    .flatMap((p) => (p[1].packs ?? []).map((pack) => pack.name))
);

for (const language of content.languages) {
  for (const field of ['key', 'label', 'direction', 'videoDir', 'assetPack']) {
    if (!language[field]) errors.push(`Language "${language.key}" is missing "${field}".`);
  }
  if (!['ltr', 'rtl'].includes(language.direction)) {
    errors.push(`Language "${language.key}" has direction "${language.direction}" (expected ltr or rtl).`);
  }

  const dir = path.join(root, 'asset-packs', language.assetPack, language.videoDir);
  if (!fs.existsSync(dir)) {
    errors.push(`Language "${language.key}": missing directory asset-packs/${language.assetPack}/${language.videoDir}/`);
  }
  if (!declaredPacks.has(language.assetPack)) {
    errors.push(
      `Language "${language.key}": asset pack "${language.assetPack}" is not listed in app.json ` +
        `under ./plugins/withAndroidAssetPacks.`
    );
  }
  if (!content.ui[language.key]) {
    errors.push(`Language "${language.key}" has no "ui" block in content.json.`);
  }
}

if (!content.languages.some((l) => l.key === content.defaultLanguage)) {
  errors.push(`defaultLanguage "${content.defaultLanguage}" is not in the languages list.`);
}
if (!content.languages.some((l) => l.key === content.fallbackLanguage)) {
  errors.push(`fallbackLanguage "${content.fallbackLanguage}" is not in the languages list.`);
}

/* ------------------------------------ videos ------------------------------------ */

const referenced = new Set();

for (const procedure of content.procedures) {
  if (!procedure.id) errors.push('A procedure is missing an "id".');

  const image = path.join(root, 'assets', procedure.image ?? '');
  if (!procedure.image || !fs.existsSync(image)) {
    errors.push(`Procedure "${procedure.id}": missing image assets/${procedure.image}`);
  }

  const videoLanguages = Object.keys(procedure.videos ?? {});
  if (videoLanguages.length === 0) {
    warnings.push(`Procedure "${procedure.id}" has no videos, so it never appears in the app.`);
  }

  for (const languageKey of videoLanguages) {
    const language = content.languages.find((l) => l.key === languageKey);
    if (!language) {
      errors.push(`Procedure "${procedure.id}" references unknown language "${languageKey}".`);
      continue;
    }

    const relative = path.join('asset-packs', language.assetPack, language.videoDir, procedure.videos[languageKey]);
    if (!fs.existsSync(path.join(root, relative))) {
      errors.push(`Procedure "${procedure.id}" (${languageKey}): missing ${relative}`);
    }
    referenced.add(relative);

    if (!procedure.title?.[languageKey]) {
      warnings.push(`Procedure "${procedure.id}" has a ${languageKey} video but no ${languageKey} title.`);
    }
  }
}

/* --------------------------------- orphan files --------------------------------- */

for (const language of content.languages) {
  const dir = path.join(root, 'asset-packs', language.assetPack, language.videoDir);
  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith('.') || !file.endsWith('.mp4')) continue;
    const relative = path.join('asset-packs', language.assetPack, language.videoDir, file);
    if (!referenced.has(relative)) {
      warnings.push(`${relative} is not referenced in content.json — it ships but is unreachable.`);
    }
  }
}

/* ------------------------------------ strings ----------------------------------- */

const allKeys = new Set(Object.values(content.ui).flatMap((strings) => Object.keys(strings)));
for (const language of content.languages) {
  for (const key of allKeys) {
    if (!content.ui[language.key]?.[key]) {
      warnings.push(`Missing UI string "${key}" for "${language.key}" (falls back to ${content.fallbackLanguage}).`);
    }
  }
}

/* ------------------------------------ report ------------------------------------ */

for (const warning of warnings) console.log(`  warning  ${warning}`);
for (const error of errors) console.log(`  error    ${error}`);

const counts = content.languages
  .map((l) => `${l.key}: ${content.procedures.filter((p) => p.videos?.[l.key]).length}`)
  .join(', ');

console.log(
  `\n${content.procedures.length} procedures, ${content.languages.length} languages (${counts})`
);

if (errors.length) {
  console.log(`\n${errors.length} error(s). Fix these before building.`);
  process.exit(1);
}
console.log(warnings.length ? `${warnings.length} warning(s), no errors.` : 'All checks passed.');

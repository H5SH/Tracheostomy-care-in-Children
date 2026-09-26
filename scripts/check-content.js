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
const { execFileSync } = require('child_process');

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

const seenCodes = new Map();

/**
 * Languages with at least one recording. A language without any is text-only: it is translated
 * and selectable, and its procedures play the fallback language's narration until its own audio
 * is produced. Those languages need no asset pack, so the delivery fields are not required.
 */
const languagesWithVideos = new Set(
  content.procedures.flatMap((procedure) => procedure.audio ?? [])
);

for (const language of content.languages) {
  const hasVideos = languagesWithVideos.has(language.key);

  for (const field of ['key', 'code', 'label', 'direction', 'audioTag']) {
    if (!language[field]) errors.push(`Language "${language.key}" is missing "${field}".`);
  }

  // The switcher renders `code` inside a fixed 48pt circle, so anything longer than two
  // characters overflows it, and a duplicate makes two languages indistinguishable.
  if (language.code && !/^[A-Z]{2}$/.test(language.code)) {
    errors.push(
      `Language "${language.key}" has code "${language.code}" (expected two uppercase letters).`
    );
  }
  if (language.code && seenCodes.has(language.code)) {
    errors.push(
      `Language "${language.key}" reuses code "${language.code}" (already used by "${seenCodes.get(language.code)}").`
    );
  }
  seenCodes.set(language.code, language.key);

  // Used to match the device locale at startup; without it the language can only be reached
  // by tapping, never auto-selected.
  if (!Array.isArray(language.locales) || language.locales.length === 0) {
    warnings.push(
      `Language "${language.key}" has no "locales", so it is never auto-selected from the device language.`
    );
  }
  if (!['ltr', 'rtl'].includes(language.direction)) {
    errors.push(`Language "${language.key}" has direction "${language.direction}" (expected ltr or rtl).`);
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

/* -------------------------------- video + audio --------------------------------- */

const videoDir = path.join(root, 'asset-packs', content.video?.assetPack ?? '', content.video?.dir ?? '');
const audioDir = path.join(root, 'asset-packs', content.audio?.assetPack ?? '', content.audio?.dir ?? '');

for (const [label, config, dir] of [
  ['video', content.video, videoDir],
  ['audio', content.audio, audioDir],
]) {
  if (!config?.assetPack || !config?.dir) {
    errors.push(`content.json needs a top-level "${label}": { "assetPack", "dir" }.`);
    continue;
  }
  if (!fs.existsSync(dir)) {
    errors.push(`Missing directory asset-packs/${config.assetPack}/${config.dir}/`);
  }
  if (!declaredPacks.has(config.assetPack)) {
    errors.push(
      `Asset pack "${config.assetPack}" is not listed in app.json under ` +
        './plugins/withAndroidAssetPacks.'
    );
  }
}

const languageKeys = new Set(content.languages.map((l) => l.key));
const referencedVideos = new Set();
const referencedAudio = new Set();

for (const procedure of content.procedures) {
  if (!procedure.id) errors.push('A procedure is missing an "id".');

  const image = path.join(root, 'assets', procedure.image ?? '');
  if (!procedure.image || !fs.existsSync(image)) {
    errors.push(`Procedure "${procedure.id}": missing image assets/${procedure.image}`);
  }

  if (!procedure.video) {
    warnings.push(`Procedure "${procedure.id}" has no video, so it never appears in the app.`);
    continue;
  }

  const videoFile = path.join(videoDir, procedure.video);
  if (!fs.existsSync(videoFile)) {
    errors.push(`Procedure "${procedure.id}": missing ${path.relative(root, videoFile)}`);
  }
  referencedVideos.add(procedure.video);

  // The picture ships once for every language, so an audio track left inside it is dead weight
  // shipped 26 times over — and it would play underneath the narration.
  if (fs.existsSync(videoFile)) {
    try {
      const probe = JSON.parse(
        execFileSync('ffprobe', ['-v', 'error', '-of', 'json', '-show_streams', videoFile]).toString()
      );
      const stray = probe.streams.filter((s) => s.codec_type === 'audio');
      if (stray.length) {
        errors.push(
          `Procedure "${procedure.id}": ${procedure.video} still has ${stray.length} audio ` +
            'track(s). Videos must be picture only — re-run scripts/audio/4-package.js.'
        );
      }
    } catch {
      warnings.push(`Procedure "${procedure.id}": could not probe ${procedure.video} (is ffprobe installed?).`);
    }
  }

  const languages = procedure.audio ?? [];
  if (languages.length === 0) {
    errors.push(`Procedure "${procedure.id}" lists no audio languages.`);
  }
  if (!languages.includes(content.fallbackLanguage)) {
    errors.push(
      `Procedure "${procedure.id}" has no "${content.fallbackLanguage}" narration, so languages ` +
        'without their own have nothing to fall back to.'
    );
  }
  for (const key of languages) {
    if (!languageKeys.has(key)) {
      errors.push(`Procedure "${procedure.id}" lists narration for unknown language "${key}".`);
      continue;
    }
    const rel = path.join(key, `${procedure.id}.m4a`);
    if (!fs.existsSync(path.join(audioDir, rel))) {
      errors.push(`Procedure "${procedure.id}": missing audio ${path.relative(root, path.join(audioDir, rel))}`);
    }
    referencedAudio.add(rel);
    if (!procedure.title?.[key]) {
      warnings.push(`Procedure "${procedure.id}" has ${key} narration but no ${key} title.`);
    }
  }
}

/* --------------------------------- orphan files --------------------------------- */

if (fs.existsSync(videoDir)) {
  for (const file of fs.readdirSync(videoDir)) {
    if (file.startsWith('.') || !file.endsWith('.mp4')) continue;
    if (!referencedVideos.has(file)) {
      warnings.push(`asset-packs/${content.video.assetPack}/${content.video.dir}/${file} is not referenced in content.json.`);
    }
  }
}

if (fs.existsSync(audioDir)) {
  for (const languageKey of fs.readdirSync(audioDir)) {
    const dir = path.join(audioDir, languageKey);
    if (languageKey.startsWith('.') || !fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.startsWith('.') || !file.endsWith('.m4a')) continue;
      if (!referencedAudio.has(path.join(languageKey, file))) {
        warnings.push(`asset-packs/${content.audio.assetPack}/${content.audio.dir}/${languageKey}/${file} is not referenced in content.json.`);
      }
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

const dubbed = content.languages.filter((l) => languagesWithVideos.has(l.key));
const textOnly = content.languages.filter((l) => !languagesWithVideos.has(l.key));

console.log(
  `\n${content.procedures.length} procedures, ${content.languages.length} languages ` +
    `(${dubbed.length} narrated, ${textOnly.length} text-only)`
);
console.log(`  narrated   ${dubbed.map((l) => l.code).join(' ')}`);
if (textOnly.length) {
  console.log(
    `  text-only  ${textOnly.map((l) => l.code).join(' ')}` +
      `\n             narration falls back to ${content.fallbackLanguage}`
  );
}

if (errors.length) {
  console.log(`\n${errors.length} error(s). Fix these before building.`);
  process.exit(1);
}
console.log(warnings.length ? `${warnings.length} warning(s), no errors.` : 'All checks passed.');

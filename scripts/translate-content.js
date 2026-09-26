#!/usr/bin/env node
/**
 * Fills in missing translations in `app/data/content.json` with Google Cloud Translation.
 *
 * Every string is translated out of `fallbackLanguage` (English) into every language declared
 * under `languages`. Declare the language first, then run this to populate it:
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/translate-content.js                 # fill in only what is missing
 *   node scripts/translate-content.js --only=ar,de    # just these languages
 *   node scripts/translate-content.js --force         # re-translate everything
 *   node scripts/translate-content.js --dry-run       # print counts, write nothing
 *
 * **The default never touches a string that already has a value**, so a reviewed translation
 * survives every later run. Review is the expensive part here, not the API call.
 *
 * `--force` re-translates strings that already have a value and so destroys review work — it
 * must name its languages with `--only=`. Running it blanket-style once replaced the
 * hand-tuned Urdu with machine output that left "tracheostomy" in Latin script, put full
 * stops on titles, and claimed the videos were narrated in English when they are in Urdu.
 *
 * Machine output is a starting point. See README.md > "Translations need review".
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const contentPath = path.join(root, 'app/data/content.json');

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',');

// Overwriting reviewed translations is never something to do by accident, so --force has to say
// which languages it means.
if (force && !only) {
  console.error('--force replaces existing translations, so it requires --only=<codes>.');
  console.error('  e.g. node scripts/translate-content.js --force --only=de,fr');
  process.exit(1);
}

/* ------------------------------- auth ------------------------------- */

async function accessToken() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON.');

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const input =
    `${b64({ alg: 'RS256', typ: 'JWT' })}.` +
    b64({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(key.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${sig}`,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Auth failed: ${JSON.stringify(json)}`);
  return { token: json.access_token, project: key.project_id };
}

/* --------------------------- placeholders --------------------------- */
/**
 * `{count}` and `{language}` must survive translation verbatim. They are fenced off with
 * `notranslate`, which is the documented way to exempt a span, and every tag is then stripped on
 * the way out — safe, because none of this content is legitimately HTML.
 *
 * **Newlines are flattened to a space before translating.** The only one is in `welcome.title`,
 * where it is an English typography choice — two balanced lines under the app icon — and not
 * part of the meaning. Sending it as `<br>` made the API translate each line on its own, and
 * "Care" with no sentence around it comes back as a verb: Hebrew returned לְטַפֵּל ("to care
 * for") and Chinese 关心 ("to care about") rather than the nursing sense. Translating
 * "Tracheostomy Care" whole fixes that. Translations therefore carry no hard break and wrap
 * naturally; `Welcome.jsx` reserves two lines of height so the layout still cannot shift.
 */
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const protect = (s) =>
  escapeHtml(s.replace(/\s*\n\s*/g, ' '))
    .replace(/\{(\w+)\}/g, '<span class="notranslate">{$1}</span>');

const unprotect = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Fencing a placeholder leaves whitespace around it in some languages — Hebrew came back
    // as "... {language} ." and Chinese as "...{language} 。".
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([.,;:!?。、，；：！？؟۔])/g, '$1')
    .trim();

const placeholdersIn = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

/* ------------------------------ strings ----------------------------- */
/**
 * Every translatable string, as a get/set pair against the parsed content. Keeping the shape
 * here rather than inline means adding a new translatable field is a one-line change.
 */
function collectSlots(content, sourceKey) {
  const slots = [];

  for (const key of Object.keys(content.ui[sourceKey])) {
    slots.push({
      label: `ui.${key}`,
      source: content.ui[sourceKey][key],
      get: (lang) => content.ui[lang]?.[key],
      set: (lang, value) => {
        content.ui[lang] ??= {};
        content.ui[lang][key] = value;
      },
    });
  }

  for (const procedure of content.procedures) {
    for (const field of ['title', 'description']) {
      slots.push({
        label: `${procedure.id}.${field}`,
        source: procedure[field][sourceKey],
        get: (lang) => procedure[field][lang],
        set: (lang, value) => {
          procedure[field][lang] = value;
        },
      });
    }
  }

  for (const resource of content.resources) {
    slots.push({
      label: `${resource.id}.description`,
      source: resource.description[sourceKey],
      get: (lang) => resource.description[lang],
      set: (lang, value) => {
        resource.description[lang] = value;
      },
    });
  }

  return slots.filter((slot) => typeof slot.source === 'string' && slot.source.length > 0);
}

/* ----------------------------- translate ---------------------------- */

async function translate({ token, project }, texts, target) {
  const out = [];
  // The API caps a request at 1024 segments; chunking also keeps each request well inside the
  // 30k codepoint limit.
  for (let i = 0; i < texts.length; i += 100) {
    const chunk = texts.slice(i, i + 100);
    const res = await fetch(
      `https://translate.googleapis.com/v3/projects/${project}/locations/global:translateText`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: chunk.map(protect),
          mimeType: 'text/html',
          sourceLanguageCode: 'en',
          targetLanguageCode: target,
        }),
      }
    );
    const json = await res.json();
    if (!json.translations) throw new Error(`${target}: ${JSON.stringify(json).slice(0, 300)}`);
    out.push(...json.translations.map((t) => unprotect(t.translatedText)));
  }
  return out;
}

/* -------------------------------- main ------------------------------ */

(async () => {
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const sourceKey = content.fallbackLanguage;
  const slots = collectSlots(content, sourceKey);

  const targets = content.languages.filter(
    (l) => l.key !== sourceKey && l.translateCode && (!only || only.includes(l.translateCode))
  );

  console.log(`${slots.length} strings x ${targets.length} languages\n`);

  const auth = dryRun ? null : await accessToken();
  const warnings = [];
  let translated = 0;

  for (const language of targets) {
    const pending = slots.filter((slot) => force || !slot.get(language.key));
    if (pending.length === 0) {
      console.log(`  ${language.key.padEnd(12)} up to date`);
      continue;
    }

    if (dryRun) {
      console.log(`  ${language.key.padEnd(12)} would translate ${pending.length}`);
      continue;
    }

    const results = await translate(auth, pending.map((s) => s.source), language.translateCode);

    pending.forEach((slot, i) => {
      const value = results[i];
      // A dropped placeholder renders as literal "{count}" text or an empty gap in the app, so
      // it is never written — the English string stays and the mismatch is reported.
      if (placeholdersIn(value) !== placeholdersIn(slot.source)) {
        warnings.push(`${language.key} / ${slot.label}: placeholder mismatch, kept English`);
        return;
      }
      slot.set(language.key, value);
      translated += 1;
    });

    console.log(`  ${language.key.padEnd(12)} ${pending.length} strings -> ${language.translateCode}`);
  }

  for (const warning of warnings) console.log(`  warning  ${warning}`);

  if (dryRun) return;
  fs.writeFileSync(contentPath, `${JSON.stringify(content, null, 2)}\n`);
  console.log(`\nWrote ${translated} translations to app/data/content.json`);
  console.log('Run: npm run check:content');
})().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});

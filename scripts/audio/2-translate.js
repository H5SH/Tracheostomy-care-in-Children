#!/usr/bin/env node
/**
 * Step 2 — translate each timed English segment into every target language.
 *
 *   node scripts/audio/2-translate.js            # fill in what is missing
 *   node scripts/audio/2-translate.js --only=de
 *
 * Reads `build/transcripts/<procedure>.json`, writes `build/scripts/<language>/<procedure>.json`
 * with the same segment boundaries and timings, text replaced.
 *
 * Segments are translated one by one rather than as flowing prose, because each one has to be
 * spoken while its own piece of action is on screen. That costs some cross-sentence context, and
 * it is the main reason these need a native speaker's eye before they become audio.
 *
 * Languages with human narration (English, Urdu) are normally skipped, and so are languages that
 * borrow another's audio (Hindi takes Urdu's) — see `lib.js`. The exception is a **gap**: Urdu has
 * no recording for the introduction, so Urdu and Hindi would fall back to English narration on the
 * very first card in the list. Those gaps are translated and synthesised like any other language,
 * so every language is complete and the fallback never fires in practice.
 */
const fs = require('fs');
const path = require('path');
const { root, build, auth, HUMAN_NARRATION, SHARED_NARRATION } = require('./lib');

const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');

async function translateAll({ token, project }, texts, target) {
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const res = await fetch(
      `https://translate.googleapis.com/v3/projects/${project}/locations/global:translateText`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: texts.slice(i, i + 100),
          mimeType: 'text/plain',
          sourceLanguageCode: 'en',
          targetLanguageCode: target,
        }),
      }
    );
    const json = await res.json();
    if (!json.translations) throw new Error(`${target}: ${JSON.stringify(json).slice(0, 300)}`);
    out.push(...json.translations.map((t) => t.translatedText));
  }
  return out;
}

(async () => {
  const transcriptDir = path.join(build, 'transcripts');
  const transcripts = fs
    .readdirSync(transcriptDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(transcriptDir, f), 'utf8')));

  // Procedures a language already has a human recording for — nothing to translate for those.
  const recordedFor = (key) => {
    const source = SHARED_NARRATION[key] ?? key;
    if (!HUMAN_NARRATION.has(source)) return new Set();
    return new Set(
      content.procedures.filter((p) => p.videos?.[source]).map((p) => p.id)
    );
  };

  const targets = content.languages.filter(
    (l) =>
      l.translateCode &&
      l.key !== sourceKey &&
      // A borrowing language takes finished audio from its source, gap fills included, so it
      // never needs a script of its own.
      !SHARED_NARRATION[l.key] &&
      (!only || only.includes(l.translateCode))
  );

  console.log(`${transcripts.length} procedures x ${targets.length} languages\n`);
  const session = await auth();

  for (const language of targets) {
    const dir = path.join(build, 'scripts', language.key);
    fs.mkdirSync(dir, { recursive: true });
    let done = 0;

    const alreadyRecorded = recordedFor(language.key);

    for (const transcript of transcripts) {
      if (alreadyRecorded.has(transcript.id)) continue;
      const out = path.join(dir, `${transcript.id}.json`);
      if (fs.existsSync(out)) continue;

      const texts = transcript.segments.map((s) => s.text);
      const translated = await translateAll(session, texts, language.translateCode);

      fs.writeFileSync(
        out,
        `${JSON.stringify(
          {
            id: transcript.id,
            language: language.key,
            duration: transcript.duration,
            segments: transcript.segments.map((s, i) => ({
              start: s.start,
              end: s.end,
              text: translated[i],
              source: s.text,
            })),
          },
          null,
          2
        )}\n`
      );
      done += 1;
    }
    console.log(`  ${language.key.padEnd(12)} ${done ? `${done} procedures` : 'cached'}`);
  }
  console.log('\nScripts in build/scripts/<language>/ — review before synthesising.');
})().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});

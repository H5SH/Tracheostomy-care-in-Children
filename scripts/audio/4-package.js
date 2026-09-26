#!/usr/bin/env node
/**
 * Step 4 — lay out what ships: one silent video per procedure, and one audio file per language.
 *
 *   node scripts/audio/4-package.js
 *
 *   asset-packs/
 *     videos/videos/<procedure>.mp4        picture only, no audio track
 *     audios/audios/<language>/<procedure>.m4a
 *
 * Video and narration are separate files rather than one muxed MP4 with many tracks. It costs a
 * little sync work at playback, and buys the ability to replace one language's narration without
 * touching the video — which matters while these translations are still being reviewed.
 *
 * The video stream is copied (`-c:v copy`), never re-encoded, so the picture is byte-identical to
 * what shipped before; stripping the audio is the only change.
 *
 * English and Urdu audio is extracted from the original recordings, so the human voices survive.
 * Hindi is a **file copy** of Urdu rather than a reference: spoken Hindi and Urdu are the same
 * language to listen to, and keeping real files in `audios/hindi/` means replacing them later is
 * a drag-and-drop, not a code change.
 */
const fs = require('fs');
const path = require('path');
const { root, build, ff, ffprobeJson, duration, HUMAN_NARRATION, SHARED_NARRATION } = require('./lib');

const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));
const byKey = Object.fromEntries(content.languages.map((l) => [l.key, l]));

const VIDEO_DIR = path.join(root, 'asset-packs/videos/videos');
const AUDIO_DIR = path.join(root, 'asset-packs/audios/audios');

const mb = (bytes) => (bytes / 1048576).toFixed(1);
const sizeOf = (f) => (fs.existsSync(f) ? fs.statSync(f).size : 0);

/** Source recording for a language's narration, or null when it has none. */
function humanSource(languageKey, procedure) {
  const language = byKey[languageKey];
  const file = procedure.videos?.[languageKey];
  if (!file || !language?.assetPack) return null;
  return path.join(root, 'asset-packs', language.assetPack, language.videoDir, file);
}

(async () => {
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.rmSync(AUDIO_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const manifest = {};
  let videoBytes = 0;
  const audioBytes = {};

  /* ------------------------------- videos ------------------------------- */
  console.log('Videos (picture only)');
  for (const procedure of content.procedures) {
    const source = humanSource('english', procedure);
    if (!source) {
      console.log(`  ${procedure.id.padEnd(26)} skipped — no English master`);
      continue;
    }
    const out = path.join(VIDEO_DIR, `${procedure.id}.mp4`);
    ff(['-i', source, '-map', '0:v:0', '-an', '-c:v', 'copy', '-movflags', '+faststart', out]);
    videoBytes += sizeOf(out);
    manifest[procedure.id] = { video: `${procedure.id}.mp4`, duration: duration(out), audio: [] };
    console.log(`  ${procedure.id.padEnd(26)} ${mb(sizeOf(out)).padStart(6)} MB  ${manifest[procedure.id].duration.toFixed(1)}s`);
  }

  /* -------------------------------- audio ------------------------------- */
  console.log('\nAudio');
  for (const language of content.languages) {
    const dir = path.join(AUDIO_DIR, language.key);
    fs.mkdirSync(dir, { recursive: true });
    let count = 0;
    let bytes = 0;

    for (const procedure of content.procedures) {
      if (!manifest[procedure.id]) continue;
      const out = path.join(dir, `${procedure.id}.m4a`);
      const borrowFrom = SHARED_NARRATION[language.key];

      if (HUMAN_NARRATION.has(language.key) || borrowFrom) {
        // Human narration: extract from the original recording. A borrowing language (Hindi)
        // takes the same source, written as its own file so it can be swapped independently.
        const source = humanSource(borrowFrom ?? language.key, procedure);
        if (!source) continue;
        ff(['-i', source, '-vn', '-ac', '1', '-c:a', 'aac', '-b:a', '64k', out]);
      } else {
        const generated = path.join(build, 'audio', language.key, `${procedure.id}.m4a`);
        if (!fs.existsSync(generated)) continue;
        fs.copyFileSync(generated, out);
      }

      count += 1;
      bytes += sizeOf(out);
      manifest[procedure.id].audio.push(language.key);
    }

    audioBytes[language.key] = bytes;
    if (count === 0) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ${language.code}  ${language.key.padEnd(12)} none`);
    } else {
      const note = SHARED_NARRATION[language.key]
        ? `copied from ${SHARED_NARRATION[language.key]}`
        : HUMAN_NARRATION.has(language.key) ? 'human recording' : 'synthesised';
      console.log(`  ${language.code}  ${language.key.padEnd(12)} ${String(count).padStart(2)} files  ${mb(bytes).padStart(6)} MB  ${note}`);
    }
  }

  fs.writeFileSync(path.join(build, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const totalAudio = Object.values(audioBytes).reduce((a, b) => a + b, 0);
  console.log(
    `\nvideo ${mb(videoBytes)} MB + audio ${mb(totalAudio)} MB = ${mb(videoBytes + totalAudio)} MB shipped`
  );
})().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});

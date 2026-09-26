#!/usr/bin/env node
/**
 * Step 3 — turn each translated script into one narration track per language.
 *
 *   node scripts/audio/3-synthesize.js [--only=german,french]
 *   -> build/audio/<language>/<procedure>.m4a   (mono AAC, exactly as long as the video)
 *
 * The hard part is not the speech, it is the clock. A sentence that takes 4s in English can take
 * 5.5s in German or Hindi, and the narration has to stay with the hands on screen — "now remove
 * the inner cannula" is useless three seconds after it has been removed.
 *
 * So each segment is placed at the timestamp its English original started, and the gap to the
 * next segment is its budget:
 *
 *   1. synthesise at the voice's natural pace and measure it;
 *   2. if it overruns, speed it up with `atempo` (pitch-preserving) up to MAX_TEMPO — past that
 *      clinical instructions start to sound rushed, which matters more than perfect sync;
 *   3. if it still overruns, let it run on and push the following segments later, accumulating
 *      drift that is reported per procedure so a human can shorten the offending sentence.
 *
 * Anything over DRIFT_WARN at the end of a video is listed at the end of the run. That list is
 * the review queue: those are the lines to shorten, not re-record.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { root, build, auth, ff, ffprobeJson, sleep } = require('./lib');

const MAX_TEMPO = 1.15;
const DRIFT_WARN = 1.5;
const SAMPLE_RATE = 24000;
const BITRATE = '48k';

const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');

const dur = (f) => Number(ffprobeJson(['-show_entries', 'format=duration', f]).format.duration);

/** One deterministic voice per language: the first female Chirp 3 HD, else the best available. */
function pickVoices(voices) {
  const byLanguage = new Map();
  for (const voice of voices) {
    for (const code of voice.languageCodes) {
      if (!byLanguage.has(code)) byLanguage.set(code, []);
      byLanguage.get(code).push(voice);
    }
  }
  const rank = (name) =>
    /Chirp3-HD/.test(name) ? 0 : /Chirp-HD/.test(name) ? 1 : /Neural2/.test(name) ? 2 : /Wavenet/.test(name) ? 3 : 4;

  return (languageCode) => {
    const candidates = (byLanguage.get(languageCode) ?? [])
      .filter((v) => v.ssmlGender === 'FEMALE')
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
    const any = (byLanguage.get(languageCode) ?? []).sort(
      (a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)
    );
    return (candidates[0] ?? any[0])?.name;
  };
}

async function synthesize({ token }, text, languageCode, voiceName, outWav) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: SAMPLE_RATE },
      }),
    });
    if (res.status === 429 || res.status >= 500) {
      await sleep(600 * 2 ** attempt);
      continue;
    }
    const json = await res.json();
    if (!json.audioContent) {
      throw new Error(`TTS ${languageCode}/${voiceName}: ${JSON.stringify(json).slice(0, 250)}`);
    }
    fs.writeFileSync(outWav, Buffer.from(json.audioContent, 'base64'));
    return;
  }
  throw new Error(`TTS gave up after retries (${languageCode})`);
}

const silence = (seconds, out) =>
  ff(['-f', 'lavfi', '-i', `anullsrc=r=${SAMPLE_RATE}:cl=mono`, '-t', Math.max(seconds, 0).toFixed(3), '-c:a', 'pcm_s16le', out]);

/** Runs `worker` over `items` with at most `limit` in flight. */
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    })
  );
  return results;
}

/** Builds one procedure's track. Returns { drift }. */
async function buildTrack(session, script, language, voiceName, outFile) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `tts-${language.key}-`));
  try {
    const parts = [];
    let cursor = 0;
    let drift = 0;

    // Segments do not depend on each other, so synthesise them all at once — doing this one round
    // trip at a time made the full run hours rather than minutes. Fitting stays sequential below,
    // because each segment's budget depends on where the previous one actually ended.
    await mapLimit(script.segments, 8, async (segment, i) => {
      const text = (segment.text ?? '').trim();
      if (!text) return;
      await synthesize(session, text, language.ttsCode, voiceName, path.join(tmp, `s${i}.wav`));
    });

    for (let i = 0; i < script.segments.length; i++) {
      const segment = script.segments[i];
      const text = (segment.text ?? '').trim();
      if (!text) continue;

      const raw = path.join(tmp, `s${i}.wav`);

      // Its budget is the gap to whatever comes next, never earlier than the previous segment
      // finished — that is what turns an overrun into cumulative drift rather than an overlap.
      const nextStart = script.segments[i + 1]?.start ?? script.duration;
      const placedStart = Math.max(segment.start, cursor);
      const budget = Math.max(nextStart - placedStart, 0.4);

      let spoken = raw;
      let length = dur(raw);
      if (length > budget) {
        const tempo = Math.min(length / budget, MAX_TEMPO);
        if (tempo > 1.01) {
          const fitted = path.join(tmp, `s${i}-fit.wav`);
          ff(['-i', raw, '-filter:a', `atempo=${tempo.toFixed(4)}`, '-c:a', 'pcm_s16le', fitted]);
          spoken = fitted;
          length = dur(fitted);
        }
      }

      const gap = path.join(tmp, `g${i}.wav`);
      silence(placedStart - cursor, gap);
      parts.push(gap, spoken);

      cursor = placedStart + length;
      drift = Math.max(drift, cursor - nextStart);
    }

    // Pad (or let ffmpeg trim) to exactly the video's length so the track never ends early.
    const tail = path.join(tmp, 'tail.wav');
    silence(Math.max(script.duration - cursor, 0.05), tail);
    parts.push(tail);

    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    ff([
      '-f', 'concat', '-safe', '0', '-i', list,
      '-t', script.duration.toFixed(3),
      '-ac', '1', '-c:a', 'aac', '-b:a', BITRATE,
      outFile,
    ]);

    return { drift: Math.max(drift, 0) };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

(async () => {
  const session = await auth();

  const voicesRes = await fetch('https://texttospeech.googleapis.com/v1/voices', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const chooseVoice = pickVoices((await voicesRes.json()).voices ?? []);

  const languages = content.languages.filter((l) => {
    const dir = path.join(build, 'scripts', l.key);
    return fs.existsSync(dir) && (!only || only.includes(l.key));
  });

  console.log(`Synthesising ${languages.length} languages\n`);
  const warnings = [];

  for (const language of languages) {
    const voiceName = chooseVoice(language.ttsCode);
    if (!voiceName) {
      warnings.push(`${language.key}: no voice for ${language.ttsCode}`);
      continue;
    }

    const scriptDir = path.join(build, 'scripts', language.key);
    const files = fs.readdirSync(scriptDir).filter((f) => f.endsWith('.json'));
    let built = 0;
    let worst = 0;

    for (const file of files) {
      const script = JSON.parse(fs.readFileSync(path.join(scriptDir, file), 'utf8'));
      const out = path.join(build, 'audio', language.key, `${script.id}.m4a`);
      if (fs.existsSync(out)) continue;

      const { drift } = await buildTrack(session, script, language, voiceName, out);
      if (drift > DRIFT_WARN) {
        warnings.push(`${language.key}/${script.id}: narration runs ${drift.toFixed(1)}s late by the end`);
      }
      worst = Math.max(worst, drift);
      built += 1;
    }

    console.log(
      `  ${language.code}  ${language.key.padEnd(12)} ${voiceName.padEnd(26)} ` +
        `${built ? `${built} tracks` : 'cached'}${worst ? `, worst drift ${worst.toFixed(1)}s` : ''}`
    );
  }

  if (warnings.length) {
    console.log(`\n${warnings.length} timing warning(s) — these sentences want shortening:`);
    for (const w of warnings) console.log(`  ${w}`);
  }
  console.log('\nAudio in build/audio/<language>/');
})().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});

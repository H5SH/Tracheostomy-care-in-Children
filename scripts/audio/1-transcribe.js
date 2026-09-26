#!/usr/bin/env node
/**
 * Step 1 — transcribe the English narration of every procedure into timed sentences.
 *
 *   node scripts/audio/1-transcribe.js  ->  build/transcripts/<procedure>.json
 *
 * Output per procedure: `{ id, duration, segments: [{ start, end, text }] }`. Those timings are
 * what every later step aligns to, so each translated sentence is spoken while the action it
 * describes is on screen.
 *
 * Long audio goes through `batchRecognize` rather than `recognize`: the synchronous endpoint caps
 * at 60 seconds and several procedures run past three minutes. Batch needs its input in Cloud
 * Storage, so the FLAC is uploaded to a temporary prefix and deleted again in the same run.
 *
 * Model is `long`, not `chirp_2`: this project is refused chirp_2 for batch ("no longer generally
 * available"), though it still serves it synchronously. `long` is the general long-form model and
 * returns the word-level timings this pipeline depends on.
 */
const fs = require('fs');
const path = require('path');
const { root, build, auth, ff, duration, gcsUpload, gcsDelete, sleep } = require('./lib');

const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));
const english = content.languages.find((l) => l.key === 'english');
const outDir = path.join(build, 'transcripts');

/** Groups words into sentences on the punctuation Chirp emits, capping runaway ones. */
function toSegments(words) {
  const segments = [];
  let current = null;

  for (const word of words) {
    const start = Number(String(word.startOffset ?? '0s').replace('s', ''));
    const end = Number(String(word.endOffset ?? '0s').replace('s', ''));
    const text = word.word ?? '';

    if (!current) current = { start, end, words: [] };
    current.words.push(text);
    current.end = end;

    const ends = /[.!?]$/.test(text);
    const tooLong = current.end - current.start > 14;
    if (ends || tooLong) {
      segments.push({ start: current.start, end: current.end, text: current.words.join(' ') });
      current = null;
    }
  }
  if (current) {
    segments.push({ start: current.start, end: current.end, text: current.words.join(' ') });
  }
  return mergeFragments(segments);
}

/**
 * Folds stray fragments back into their neighbour.
 *
 * The 14-second cap above splits long runs mid-sentence, which can leave a tail of one or two
 * words — hand-hygiene ended with a 0.3s segment containing just "level." Synthesising that on
 * its own produces a stranded word in a 0.9s slot, so anything too short to be a sentence is
 * merged into the segment before it (or after it, when it is the first).
 */
function mergeFragments(segments, minWords = 3, minSeconds = 1.2) {
  const merged = [];

  for (const segment of segments) {
    const tooSmall =
      segment.text.trim().split(/\s+/).length < minWords || segment.end - segment.start < minSeconds;

    if (tooSmall && merged.length > 0) {
      const previous = merged[merged.length - 1];
      previous.text = `${previous.text} ${segment.text}`.trim();
      previous.end = segment.end;
      continue;
    }
    merged.push({ ...segment });
  }

  // A fragment that led the file has nothing before it, so fold it forward instead.
  if (merged.length > 1) {
    const first = merged[0];
    if (first.text.trim().split(/\s+/).length < minWords) {
      merged[1].start = first.start;
      merged[1].text = `${first.text} ${merged[1].text}`.trim();
      merged.shift();
    }
  }
  return merged;
}

async function transcribe(session, gcsUri) {
  const { token, project } = session;
  const location = 'us-central1';
  const res = await fetch(
    `https://${location}-speech.googleapis.com/v2/projects/${project}/locations/${location}/recognizers/_:batchRecognize`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ uri: gcsUri }],
        config: {
          autoDecodingConfig: {},
          languageCodes: ['en-US'],
          model: 'long',
          features: { enableWordTimeOffsets: true, enableAutomaticPunctuation: true },
        },
        recognitionOutputConfig: { inlineResponseConfig: {} },
      }),
    }
  );
  const op = await res.json();
  if (!op.name) throw new Error(`batchRecognize failed: ${JSON.stringify(op).slice(0, 400)}`);

  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const poll = await fetch(`https://${location}-speech.googleapis.com/v2/${op.name}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const state = await poll.json();
    if (state.error) throw new Error(`operation error: ${JSON.stringify(state.error).slice(0, 300)}`);
    if (state.done) {
      const perFile = Object.values(state.response?.results ?? {})[0];
      const results = perFile?.transcript?.results ?? [];
      return results.flatMap((r) => r.alternatives?.[0]?.words ?? []);
    }
  }
  throw new Error('timed out waiting for batchRecognize');
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const session = await auth();

  const targets = content.procedures.filter((p) => p.videos?.english);
  console.log(`Transcribing ${targets.length} English narrations\n`);

  for (const procedure of targets) {
    const out = path.join(outDir, `${procedure.id}.json`);
    if (fs.existsSync(out)) {
      console.log(`  ${procedure.id.padEnd(26)} cached`);
      continue;
    }

    const video = path.join(root, 'asset-packs', english.assetPack, english.videoDir, procedure.videos.english);
    const flac = path.join(build, `${procedure.id}.flac`);
    ff(['-i', video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'flac', flac]);

    const object = `${procedure.id}.flac`;
    const uri = await gcsUpload(session, flac, object);
    try {
      const words = await transcribe(session, uri);
      const segments = toSegments(words);
      const total = duration(video);
      fs.writeFileSync(
        out,
        `${JSON.stringify({ id: procedure.id, duration: total, segments }, null, 2)}\n`
      );
      const spoken = segments.reduce((t, s) => t + (s.end - s.start), 0);
      console.log(
        `  ${procedure.id.padEnd(26)} ${segments.length} segments, ` +
          `${spoken.toFixed(0)}s speech / ${total.toFixed(0)}s video`
      );
    } finally {
      await gcsDelete(session, object);
      fs.unlinkSync(flac);
    }
  }
  console.log(`\nTranscripts in build/transcripts/ — review before translating.`);
})().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});

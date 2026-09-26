#!/usr/bin/env node
/**
 * Step 1b — fix what speech-to-text misheard, before anything is translated.
 *
 *   node scripts/audio/1b-correct.js            # report what would change
 *   node scripts/audio/1b-correct.js --write    # apply to build/transcripts/
 *
 * The narrator speaks Pakistani-accented English, and every model tried (`long`, `chirp`,
 * `latest_long`, with and without phrase hints) returned the same mishearings: "suction" as
 * "section", "tracheostomy" as "trichotomy" / "tricosmy" / "Trek azmat", "cannula" as "canola",
 * "gauze" as "cause". Left alone those go into every translated language, so "suction pressure"
 * becomes "cross-section pressure" in twenty-three languages.
 *
 * The substitutions live in `corrections.json` so they can be read and argued with. Re-run this
 * after editing that file; it rewrites from `.raw.json` each time, so corrections never stack.
 */
const fs = require('fs');
const path = require('path');
const { build } = require('./lib');

const write = process.argv.includes('--write');
const { terms, flagForReview } = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'corrections.json'), 'utf8')
);
const dir = path.join(build, 'transcripts');

const rules = terms.map(([pattern, replacement]) => ({
  re: new RegExp(pattern, 'gi'),
  replacement,
}));

/** Keeps the replacement's case in step with what it replaced, so sentences still start capitalised. */
function applyCase(original, replacement) {
  if (/^[A-Z]/.test(original) && !/^[A-Z]/.test(replacement)) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

let changed = 0;
const flagged = [];

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.raw.json'))) {
  const full = path.join(dir, file);
  const raw = full.replace(/\.json$/, '.raw.json');

  // The first run keeps a pristine copy; later runs always start from it.
  if (!fs.existsSync(raw)) fs.copyFileSync(full, raw);
  const transcript = JSON.parse(fs.readFileSync(raw, 'utf8'));

  const edits = [];
  for (const segment of transcript.segments) {
    const before = segment.text;
    let after = before;
    for (const { re, replacement } of rules) {
      after = after.replace(re, (match) => applyCase(match, replacement));
    }
    if (after !== before) {
      edits.push({ before, after });
      segment.text = after;
    }
    for (const phrase of flagForReview) {
      if (after.toLowerCase().includes(phrase.toLowerCase())) {
        flagged.push(`${transcript.id}: "${phrase}" — ${after.trim().slice(0, 90)}`);
      }
    }
  }

  if (edits.length) {
    changed += edits.length;
    console.log(`\n${transcript.id}  (${edits.length} segment${edits.length > 1 ? 's' : ''})`);
    for (const { before, after } of edits) {
      const [b, a] = firstDifference(before, after);
      console.log(`   - ${b}`);
      console.log(`   + ${a}`);
    }
  }
  if (write) fs.writeFileSync(full, `${JSON.stringify(transcript, null, 2)}\n`);
}

/** Trims both strings to the neighbourhood of their first difference, for a readable diff. */
function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 30);
  const clip = (s) => `${from > 0 ? '…' : ''}${s.slice(from, from + 110)}${s.length > from + 110 ? '…' : ''}`;
  return [clip(a), clip(b)];
}

console.log(`\n${changed} segment(s) corrected${write ? ' and written' : ' (dry run — pass --write)'}`);

if (flagged.length) {
  console.log(`\n${flagged.length} phrase(s) still look garbled and need a human who can hear the audio:`);
  for (const f of [...new Set(flagged)]) console.log(`  ${f}`);
}

#!/usr/bin/env node
/**
 * Guards the platform split that keeps the Android APK small.
 *
 * Android must ship ZERO videos in the JS bundle (they come from the Play Asset Delivery packs).
 * iOS must ship every video (Play Asset Delivery does not exist there).
 *
 * A stray `require()` of an .mp4 from shared code would silently add >300 MB to the Android
 * build, which is exactly the problem asset packs were adopted to solve. Run before releasing:
 *
 *   npm run check:bundles
 *
 * This runs two full Metro exports, so it takes a couple of minutes.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));

// One silent video per procedure, plus one narration file per language per procedure.
const expectedVideos = content.procedures.filter((procedure) => procedure.video).length;

/**
 * Metro deduplicates assets by content, so byte-identical files bundle once however many paths
 * point at them. Hindi's narration is a copy of Urdu's, so counting files on disk overcounts by
 * eight. Counting distinct contents is what the bundle will actually hold — and the day Hindi is
 * replaced with its own recording, this number rises on its own.
 */
const expectedAudio = (() => {
  const hashes = new Set();
  for (const procedure of content.procedures) {
    for (const language of procedure.audio ?? []) {
      const file = path.join(
        root, 'asset-packs', content.audio.assetPack, content.audio.dir, language, `${procedure.id}.m4a`
      );
      if (fs.existsSync(file)) {
        hashes.add(crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex'));
      }
    }
  }
  return hashes.size;
})();

function exportAndCount(platform) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `bundlecheck-${platform}-`));
  try {
    execFileSync(
      'npx',
      ['expo', 'export', '--platform', platform, '--output-dir', out, '--no-minify'],
      { cwd: root, stdio: 'pipe' }
    );
    const metadata = JSON.parse(fs.readFileSync(path.join(out, 'metadata.json'), 'utf8'));
    const assets = metadata.fileMetadata?.[platform]?.assets ?? [];
    return {
      videos: assets.filter((asset) => asset.ext === 'mp4').length,
      audio: assets.filter((asset) => asset.ext === 'm4a').length,
    };
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

let failed = false;

const android = exportAndCount('android');
if (android.videos === 0 && android.audio === 0) {
  console.log('  ok     android: 0 media files in the JS bundle (delivered by asset packs)');
} else {
  console.log(
    `  FAIL   android: ${android.videos} video(s) and ${android.audio} audio file(s) in the JS ` +
      'bundle — expected 0 of each.'
  );
  console.log('         Something in shared code is require()-ing media. It must only be required');
  console.log('         from app/media/assetPackVideos.js, which Android never loads.');
  failed = true;
}

const ios = exportAndCount('ios');
if (ios.videos === expectedVideos && ios.audio === expectedAudio) {
  console.log(`  ok     ios:     ${ios.videos} videos + ${ios.audio} audio files bundled (matches content.json)`);
} else {
  console.log(
    `  FAIL   ios:     ${ios.videos} video(s) and ${ios.audio} audio file(s) bundled — expected ` +
      `${expectedVideos} and ${expectedAudio}.`
  );
  console.log('         Run `npm run check:content` first; a missing file is the usual cause.');
  failed = true;
}

process.exit(failed ? 1 : 0);

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
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'app/data/content.json'), 'utf8'));

const expectedVideos = content.procedures.reduce(
  (total, procedure) => total + Object.keys(procedure.videos ?? {}).length,
  0
);

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
    return assets.filter((asset) => asset.ext === 'mp4').length;
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

let failed = false;

const android = exportAndCount('android');
if (android === 0) {
  console.log('  ok     android: 0 videos in the JS bundle (delivered by asset packs)');
} else {
  console.log(`  FAIL   android: ${android} video(s) in the JS bundle — expected 0.`);
  console.log('         Something in shared code is require()-ing an .mp4. Videos must only be');
  console.log('         required from app/media/assetPackVideos.js (non-Android).');
  failed = true;
}

const ios = exportAndCount('ios');
if (ios === expectedVideos) {
  console.log(`  ok     ios:     ${ios} videos bundled (matches content.json)`);
} else {
  console.log(`  FAIL   ios:     ${ios} video(s) bundled — expected ${expectedVideos}.`);
  console.log('         Run `npm run check:content` first; a missing file is the usual cause.');
  failed = true;
}

process.exit(failed ? 1 : 0);

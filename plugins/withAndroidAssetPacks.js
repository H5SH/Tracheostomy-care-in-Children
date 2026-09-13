/**
 * withAndroidAssetPacks
 * ---------------------
 * Expo config plugin that adds Google Play Asset Delivery (PAD) asset packs to
 * the Android project that `expo prebuild` generates.
 *
 * It is a pure CNG plugin: the `android/` directory stays generated/disposable,
 * so `npx expo prebuild --clean` and EAS Build keep working unchanged.
 *
 * For every configured pack it:
 *   1. generates `android/<packName>/build.gradle` applying `com.android.asset-pack`,
 *   2. mirrors `<sourceDir>/**` into `android/<packName>/src/main/assets/**`
 *      (hard links, so a 100 MB+ video pack costs no extra disk and no copy time),
 *   3. adds `include ':<packName>'` to `android/settings.gradle`,
 *   4. adds `assetPacks = [':<packName>']` to the `android {}` block of
 *      `android/app/build.gradle`.
 *
 * Assets of an *install-time* pack are merged into the app's normal asset space
 * by Play, so at runtime they are read through `AssetManager` — see
 * `modules/asset-packs` for the native bridge and `docs/asset-delivery.md`.
 *
 * Usage (app.json):
 *   ["./plugins/withAndroidAssetPacks", {
 *     "packs": [
 *       { "name": "urdu_videos", "sourceDir": "./asset-packs/urdu_videos", "deliveryType": "install-time" }
 *     ]
 *   }]
 */
const fs = require('fs');
const path = require('path');

const { withAppBuildGradle, withDangerousMod, withSettingsGradle } = require('expo/config-plugins');

const TAG = 'withAndroidAssetPacks';
const MARKER_START = `// @generated begin ${TAG} - do not modify by hand`;
const MARKER_END = `// @generated end ${TAG}`;

// https://developer.android.com/guide/playcore/asset-delivery#asset_pack_names
const PACK_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const DELIVERY_TYPES = ['install-time', 'fast-follow', 'on-demand'];

/* -------------------------------------------------------------------------- */
/* props                                                                      */
/* -------------------------------------------------------------------------- */

function normalizePacks(props, projectRoot) {
  const packs = props?.packs;
  if (!Array.isArray(packs) || packs.length === 0) {
    throw new Error(`[${TAG}] Expected a non-empty "packs" array in the plugin options.`);
  }

  return packs.map((pack) => {
    const { name, sourceDir, deliveryType = 'install-time' } = pack ?? {};

    if (!PACK_NAME_RE.test(name ?? '')) {
      throw new Error(
        `[${TAG}] Invalid pack name ${JSON.stringify(name)}. Play requires a name that starts ` +
          `with a letter and contains only letters, digits and underscores.`
      );
    }
    if (!DELIVERY_TYPES.includes(deliveryType)) {
      throw new Error(
        `[${TAG}] Invalid deliveryType ${JSON.stringify(deliveryType)} for pack "${name}". ` +
          `Expected one of: ${DELIVERY_TYPES.join(', ')}.`
      );
    }
    if (typeof sourceDir !== 'string' || !sourceDir) {
      throw new Error(`[${TAG}] Pack "${name}" is missing a "sourceDir".`);
    }

    const resolvedSourceDir = path.resolve(projectRoot, sourceDir);
    if (!fs.existsSync(resolvedSourceDir)) {
      throw new Error(`[${TAG}] Pack "${name}" points at a missing directory: ${resolvedSourceDir}`);
    }

    return { name, deliveryType, sourceDir: resolvedSourceDir };
  });
}

/* -------------------------------------------------------------------------- */
/* file mirroring                                                             */
/* -------------------------------------------------------------------------- */

/** Entries that must never end up inside the AAB. */
function isIgnored(name) {
  return name.startsWith('.');
}

/**
 * Materialize `src` at `dest` without copying bytes when we can avoid it.
 * A hard link makes the build see a real file while sharing storage with the
 * checked-in original, which matters a lot for a >100 MB video pack.
 */
function linkOrCopyFile(src, dest, stats) {
  const srcStat = fs.statSync(src);

  let destStat = null;
  try {
    destStat = fs.statSync(dest);
  } catch {
    // not there yet
  }

  if (destStat) {
    const sameInode = destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    const sameContent = destStat.size === srcStat.size && destStat.mtimeMs === srcStat.mtimeMs;
    if (sameInode || sameContent) {
      stats.unchanged += 1;
      return;
    }
    fs.rmSync(dest, { force: true });
  }

  try {
    fs.linkSync(src, dest);
    stats.linked += 1;
  } catch {
    // Different filesystem (common in CI containers): fall back to a copy,
    // preferring a copy-on-write clone when the filesystem supports one.
    try {
      fs.copyFileSync(src, dest, fs.constants.COPYFILE_FICLONE);
    } catch {
      fs.copyFileSync(src, dest);
    }
    // Keep mtime so the next prebuild can skip this file.
    fs.utimesSync(dest, srcStat.atime, srcStat.mtime);
    stats.copied += 1;
  }
}

/** Make `destDir` an exact mirror of `srcDir`, pruning anything stale. */
function mirrorDirectory(srcDir, destDir, stats) {
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true }).filter((e) => !isIgnored(e.name));
  const expected = new Set(entries.map((e) => e.name));

  for (const stale of fs.readdirSync(destDir)) {
    if (!expected.has(stale)) {
      fs.rmSync(path.join(destDir, stale), { recursive: true, force: true });
      stats.removed += 1;
    }
  }

  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      mirrorDirectory(src, dest, stats);
    } else if (entry.isFile()) {
      linkOrCopyFile(src, dest, stats);
    }
  }
}

function countFiles(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (isIgnored(entry.name)) continue;
    if (entry.isDirectory()) total += countFiles(path.join(dir, entry.name));
    else if (entry.isFile()) total += 1;
  }
  return total;
}

/* -------------------------------------------------------------------------- */
/* gradle                                                                     */
/* -------------------------------------------------------------------------- */

function assetPackBuildGradle(pack) {
  // `apply plugin` (rather than the `plugins {}` DSL) resolves the Android
  // Gradle Plugin from the root project's buildscript classpath, which is how
  // the Expo template declares it.
  return [
    `// Generated by the ${TAG} config plugin. Do not edit — edit app.json instead.`,
    "apply plugin: 'com.android.asset-pack'",
    '',
    'assetPack {',
    `    packName = "${pack.name}"`,
    '    dynamicDelivery {',
    `        deliveryType = "${pack.deliveryType}"`,
    '    }',
    '}',
    '',
  ].join('\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Drop a previously generated block so the plugin is safely re-runnable. */
function stripGeneratedBlock(contents) {
  const block = new RegExp(
    `[ \\t]*${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}\\n?`,
    'g'
  );
  return contents.replace(block, '');
}

function withAssetPackModules(config, packs) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const androidRoot = config.modRequest.platformProjectRoot;

      for (const pack of packs) {
        const moduleDir = path.join(androidRoot, pack.name);
        const assetsDir = path.join(moduleDir, 'src', 'main', 'assets');

        fs.mkdirSync(moduleDir, { recursive: true });
        fs.writeFileSync(path.join(moduleDir, 'build.gradle'), assetPackBuildGradle(pack));

        const fileCount = countFiles(pack.sourceDir);
        if (fileCount === 0) {
          throw new Error(
            `[${TAG}] Pack "${pack.name}" would ship empty — no files found under ${pack.sourceDir}.`
          );
        }

        const stats = { linked: 0, copied: 0, unchanged: 0, removed: 0 };
        mirrorDirectory(pack.sourceDir, assetsDir, stats);

        console.log(
          `[${TAG}] ${pack.name} (${pack.deliveryType}): ${fileCount} asset file(s) — ` +
            `${stats.linked} linked, ${stats.copied} copied, ${stats.unchanged} unchanged, ` +
            `${stats.removed} pruned.`
        );
      }

      return config;
    },
  ]);
}

function withAssetPackSettingsGradle(config, packs) {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(`[${TAG}] Only a Groovy settings.gradle is supported.`);
    }

    const body = packs.map((pack) => `include ':${pack.name}'`).join('\n');
    const contents = stripGeneratedBlock(config.modResults.contents).trimEnd();

    config.modResults.contents = `${contents}\n\n${MARKER_START}\n${body}\n${MARKER_END}\n`;
    return config;
  });
}

function withAssetPackAppBuildGradle(config, packs) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(`[${TAG}] Only a Groovy app/build.gradle is supported.`);
    }

    const contents = stripGeneratedBlock(config.modResults.contents);
    const androidBlock = /^android\s*\{[ \t]*$/m;

    if (!androidBlock.test(contents)) {
      throw new Error(`[${TAG}] Could not find the "android {" block in app/build.gradle.`);
    }

    const list = packs.map((pack) => `":${pack.name}"`).join(', ');
    const injected = [
      '',
      `    ${MARKER_START}`,
      '    // Google Play Asset Delivery packs, generated from app.json.',
      `    assetPacks = [${list}]`,
      `    ${MARKER_END}`,
    ].join('\n');

    config.modResults.contents = contents.replace(androidBlock, (match) => `${match}${injected}`);
    return config;
  });
}

/* -------------------------------------------------------------------------- */

const withAndroidAssetPacks = (config, props) => {
  const packs = normalizePacks(props, config._internal?.projectRoot ?? process.cwd());

  config = withAssetPackModules(config, packs);
  config = withAssetPackSettingsGradle(config, packs);
  config = withAssetPackAppBuildGradle(config, packs);

  return config;
};

module.exports = withAndroidAssetPacks;

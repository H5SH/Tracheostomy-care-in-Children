/**
 * Media resolution for every platform except Android — see `assetPackVideos.android.js` for the
 * Play Asset Delivery path.
 *
 * Play Asset Delivery is Android-only, so here the same files are bundled as ordinary React Native
 * assets straight out of `asset-packs/`. There is one copy of each on disk; only the delivery
 * mechanism differs.
 *
 * Video and narration are separate files: `asset-packs/videos/videos/<procedure>.mp4` holds the
 * picture with no audio track, and `asset-packs/audios/audios/<language>/<procedure>.m4a` holds
 * one language's narration. `MedVideo` plays them together.
 *
 * The contexts are scoped to the two shipping packs rather than all of `asset-packs/`, because the
 * original per-language recordings still live there as masters and a broader context would bundle
 * those too. `npm run check:bundles` fails if that regresses.
 *
 * Metro picks `assetPackVideos.android.js` for Android builds and never walks this module, so
 * these files do NOT land in the Android APK — that is the point of the platform split.
 */
const videoContext = require.context('../../asset-packs/videos', true, /\.mp4$/);
const audioContext = require.context('../../asset-packs/audios', true, /\.m4a$/);

function resolve(context, locator, kind) {
  if (!locator?.path) return null;
  try {
    return context(`./${locator.path}`);
  } catch {
    if (__DEV__) {
      console.warn(`[${kind}] Missing "asset-packs/${locator.pack}/${locator.path}".`);
    }
    return null;
  }
}

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {number | null} a bundled asset id for `useVideoPlayer`, or `null` when missing.
 */
export function resolveVideoSource(locator) {
  return resolve(videoContext, locator, 'video');
}

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {number | null} a bundled asset id for `useAudioPlayer`, or `null` when missing.
 */
export function resolveAudioSource(locator) {
  return resolve(audioContext, locator, 'audio');
}

export const videosAreBundled = true;

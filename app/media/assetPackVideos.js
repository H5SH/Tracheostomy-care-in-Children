/**
 * Video resolution for every platform except Android — see `assetPackVideos.android.js` for the
 * Play Asset Delivery path.
 *
 * Play Asset Delivery is Android-only, so here the same `.mp4` files are bundled as ordinary
 * React Native assets straight out of `asset-packs/`. There is one copy of each file on disk;
 * only the delivery mechanism differs.
 *
 * `require.context` means a new video needs no code change — drop the file into the right
 * `asset-packs/<pack>/<videoDir>/` folder, reference it in `content.json`, and Metro finds it.
 *
 * Metro picks `assetPackVideos.android.js` for Android builds and never walks this module, so
 * these videos do NOT land in the Android APK — that is the point of the platform split. Verify
 * with `npm run check:bundles`.
 */
const videoContext = require.context('../../asset-packs', true, /\.mp4$/);

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {number | null} a bundled asset id for `useVideoPlayer`, or `null` when the file is
 *   missing from `asset-packs/`.
 */
export function resolveVideoSource(locator) {
  if (!locator?.pack || !locator?.path) {
    return null;
  }

  const key = `./${locator.pack}/${locator.path}`;
  try {
    return videoContext(key);
  } catch {
    if (__DEV__) {
      console.warn(`[video] Missing "asset-packs/${locator.pack}/${locator.path}".`);
    }
    return null;
  }
}

export const videosAreBundled = true;

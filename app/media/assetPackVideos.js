/**
 * Resolves the training videos that ship in the `urdu_videos` Play Asset Delivery pack.
 *
 * The pack is delivered *install-time*, so its files are already on the device when the app first
 * opens — nothing is downloaded here and playback works with no network at all. See
 * `docs/asset-delivery.md` for how the pack is built.
 */
import { isAvailable as assetPacksAvailable, getAssetUri } from '../../modules/asset-packs';

/** Root of the Urdu pack inside the merged asset space, matching `asset-packs/urdu_videos/`. */
export const URDU_VIDEO_DIR = 'videos/urdu';

// `getAssetUri` hits AssetManager, so memoize: the answer cannot change while the app is running.
const cache = new Map();

/**
 * @param {string | undefined} assetPath pack-relative path, e.g. `videos/urdu/HandHygieneUrdu.mp4`
 * @returns {{ uri: string } | null} a source for `useVideoPlayer`, or `null` when the video is not
 *   installed (missing translation, or a build without the asset pack such as Expo Go or iOS).
 */
export function resolveVideoSource(assetPath) {
  if (!assetPath) {
    return null;
  }
  if (cache.has(assetPath)) {
    return cache.get(assetPath);
  }

  const uri = getAssetUri(assetPath);
  const source = uri ? { uri } : null;

  if (__DEV__ && !source) {
    console.warn(
      assetPacksAvailable
        ? `[assetPackVideos] "${assetPath}" is not in the installed asset packs.`
        : '[assetPackVideos] The AssetPacks native module is unavailable — use a development ' +
            'build (npx expo run:android) rather than Expo Go.'
    );
  }

  cache.set(assetPath, source);
  return source;
}

/** Whether asset-pack videos can play at all on this build. */
export const canPlayAssetPackVideos = assetPacksAvailable;

/**
 * Android video resolution: Google Play Asset Delivery install-time asset packs.
 *
 * Play merges an install-time pack into the app's asset space, so the files are already on the
 * device when the app first opens and are read straight from `AssetManager` — nothing downloads
 * and playback needs no network. See `docs/asset-delivery.md`.
 *
 * Note that the pack name is not part of the runtime path: Play merges every install-time pack
 * into one namespace, so `videos/urdu/Foo.mp4` resolves whichever pack shipped it.
 */
import { isAvailable as assetPacksAvailable, getAssetUri } from '../../modules/asset-packs';

// `getAssetUri` hits AssetManager, so memoize: the answer cannot change while the app is running.
const cache = new Map();

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {{ uri: string } | null} a source for `useVideoPlayer`, or `null` when the file is not
 *   installed (a build without the asset pack, such as Expo Go).
 */
export function resolveVideoSource(locator) {
  if (!locator?.path) {
    return null;
  }
  if (cache.has(locator.path)) {
    return cache.get(locator.path);
  }

  const uri = getAssetUri(locator.path);
  const source = uri ? { uri } : null;

  if (__DEV__ && !source) {
    console.warn(
      assetPacksAvailable
        ? `[video] "${locator.path}" is not in the installed asset packs.`
        : '[video] The AssetPacks native module is unavailable — use a development build ' +
            '(npx expo run:android) rather than Expo Go.'
    );
  }

  cache.set(locator.path, source);
  return source;
}

export const videosAreBundled = false;

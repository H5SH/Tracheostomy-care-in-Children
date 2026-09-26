/**
 * Android media resolution: Google Play Asset Delivery install-time asset packs.
 *
 * Play merges an install-time pack into the app's asset space, so the files are already on the
 * device when the app first opens and are read straight from `AssetManager` — nothing downloads
 * and playback needs no network. See `docs/asset-delivery.md`.
 *
 * Note that the pack name is not part of the runtime path: Play merges every install-time pack
 * into one namespace, so `videos/hand-hygiene.mp4` and `audios/german/hand-hygiene.m4a` resolve
 * out of whichever pack shipped them.
 */
import { isAvailable as assetPacksAvailable, getAssetUri } from '../../modules/asset-packs';

// `getAssetUri` hits AssetManager, so memoize: the answer cannot change while the app is running.
const cache = new Map();

function resolve(locator, kind) {
  if (!locator?.path) return null;
  if (cache.has(locator.path)) return cache.get(locator.path);

  const uri = getAssetUri(locator.path);
  const source = uri ? { uri } : null;

  if (__DEV__ && !source) {
    console.warn(
      assetPacksAvailable
        ? `[${kind}] "${locator.path}" is not in the installed asset packs.`
        : '[media] The AssetPacks native module is unavailable — use a development build ' +
            '(npx expo run:android) rather than Expo Go.'
    );
  }

  cache.set(locator.path, source);
  return source;
}

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {{ uri: string } | null} a source for `useVideoPlayer`, or `null` when not installed.
 */
export function resolveVideoSource(locator) {
  return resolve(locator, 'video');
}

/**
 * @param {{ pack: string, path: string } | undefined} locator from `catalog.proceduresFor`
 * @returns {{ uri: string } | null} a source for `useAudioPlayer`, or `null` when not installed.
 */
export function resolveAudioSource(locator) {
  return resolve(locator, 'audio');
}

export const videosAreBundled = false;

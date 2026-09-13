/**
 * JS surface for the `AssetPacks` native module.
 *
 * Reads files delivered by a Google Play Asset Delivery install-time asset pack. Every path is
 * relative to the pack's asset root (the plugin's `sourceDir`), e.g. `videos/urdu/Foo.mp4`.
 *
 * The module only exists on Android. On every other platform — and in Expo Go, which cannot load
 * custom native code — `isAvailable` is `false` and the functions degrade to safe no-ops so the
 * JS bundle keeps running.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

const AssetPacks = requireOptionalNativeModule('AssetPacks');

/** Whether asset pack files can be read on this platform/build. */
export const isAvailable = AssetPacks != null;

/** URI prefix that maps onto the merged Android asset space. */
export const assetUriPrefix = AssetPacks?.assetUriPrefix ?? 'file:///android_asset/';

/** @returns {boolean} whether `assetPath` is present in the installed asset packs. */
export function assetExists(assetPath) {
  return AssetPacks?.assetExists(assetPath) ?? false;
}

/**
 * @returns {string | null} a URI `expo-video` (media3/ExoPlayer) can play directly, or `null`
 * when the file is not installed.
 */
export function getAssetUri(assetPath) {
  return AssetPacks?.getAssetUri(assetPath) ?? null;
}

/** @returns {string[]} every file under `directory`, recursively, relative to the asset root. */
export function listAssets(directory) {
  return AssetPacks?.listAssets(directory) ?? [];
}

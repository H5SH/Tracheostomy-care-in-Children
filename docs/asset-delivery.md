# Offline videos via Google Play Asset Delivery

The Urdu training videos (139 MB) ship inside a **Play Asset Delivery (PAD) install-time asset
pack** called `urdu_videos`. Play installs the pack together with the app, so every video is on
the device the first time the app opens — there is no download screen, no post-install fetch and
no network dependency at playback time.

This replaces the old approach of `require()`-ing the `.mp4` files as React Native assets, which
pushed them into the base APK and past Play's 200 MB base-module limit.

## Layout

```
app/
├── asset-packs/
│   └── urdu_videos/            # source of truth, version-controlled
│       └── videos/urdu/*.mp4   # becomes "videos/urdu/…" at runtime
├── plugins/
│   └── withAndroidAssetPacks.js  # generates the Gradle asset pack module
├── modules/
│   └── asset-packs/              # native bridge (Kotlin) + JS wrapper
└── app/
    ├── media/assetPackVideos.js  # path -> playable source
    └── data/deases.js            # language -> { procedure: asset path }
```

The directory tree under `asset-packs/<packName>/` **is** the pack's asset namespace: a file at
`asset-packs/urdu_videos/videos/urdu/HandHygieneUrdu.mp4` is addressed at runtime as
`videos/urdu/HandHygieneUrdu.mp4`.

## Build wiring

`android/` stays generated (CNG) — nothing about this is committed. On every `expo prebuild`, the
`withAndroidAssetPacks` config plugin, configured in `app.json`:

1. writes `android/urdu_videos/build.gradle` applying `com.android.asset-pack` with
   `deliveryType = "install-time"`;
2. mirrors `asset-packs/urdu_videos/**` into `android/urdu_videos/src/main/assets/**` using
   **hard links**, so the 139 MB costs no extra disk and no copy time, and stale files are pruned;
3. appends `include ':urdu_videos'` to `android/settings.gradle`;
4. injects `assetPacks = [":urdu_videos"]` into the `android {}` block of `android/app/build.gradle`.

Both Gradle edits are fenced with `@generated` markers, so re-running the plugin replaces them
rather than duplicating them.

`.mp4` is in the Android Gradle Plugin's default `noCompress` list, so the videos are stored
uncompressed in the bundle. That is what makes seeking cheap — see below.

## Runtime access

An install-time pack is delivered as a split APK whose assets Play merges into the app's ordinary
asset space. So the files are read through `AssetManager`, exactly like `src/main/assets` content,
and they are reachable via the `file:///android_asset/…` URI scheme.

Play Core's `AssetPackManager` is deliberately **not** used: it exists to track *downloads* of
fast-follow and on-demand packs, which land on the filesystem. For an install-time pack it has
nothing to report (`packStorageMethod` is `APK_ASSETS`, `assetsPath()` is null), so depending on it
would add a library and a failure mode for no benefit.

### The native module

`modules/asset-packs` is a local Expo module (autolinked from `modules/`, no `package.json`
needed) exposing `AssetPacks` with three synchronous functions. Paths may be given with or without
a leading slash or the `file:///android_asset/` prefix.

| Function | Returns |
| --- | --- |
| `assetExists(path)` | `true` when the file is readable from the installed packs |
| `getAssetUri(path)` | `file:///android_asset/<path>`, or `null` when not installed |
| `listAssets(dir)` | every file under `dir`, recursively, relative to the asset root |

`getAssetUri` verifies the file is really there before handing back a URI, so a missing pack
surfaces as `null` rather than as a playback error.

### Playing the videos

`expo-video` passes a non-`http` URI to media3's `DefaultDataSource`, which routes
`file:///android_asset/…` to `AssetDataSource` and reads through `AssetManager`. Nothing is copied
to the filesystem first. Because the `.mp4` entries are stored uncompressed, `AssetDataSource` can
seek within them efficiently.

```js
import { getAssetUri } from '../../modules/asset-packs';

const uri = getAssetUri('videos/urdu/HandHygieneUrdu.mp4');
const player = useVideoPlayer(uri ? { uri } : null);
```

In app code, go through `app/media/assetPackVideos.js` instead — it memoizes the lookup and warns
in development when a path is missing:

```js
import { resolveVideoSource } from '../media/assetPackVideos';

const source = resolveVideoSource(language.videos[name]); // { uri } | null
```

`MedVideo` renders a "not available in this language yet" panel when the source is `null`, which
covers untranslated procedures as well as builds without the pack.

## Languages shown in the UI

`languages` in `app/data/deases.js` drives the buttons on the video screen; the first entry is the
default. Today it holds Urdu only.

- **English** is hidden because the collection is incomplete. The files are untouched under
  `assets/Videos/English/`; the mapping is kept commented out in `deases.js`.
- **Punjabi** is hidden because only one procedure was recorded. The file is untouched under
  `../videos/Punjabi/`.

To bring a language back: add its videos under `asset-packs/<lang>_videos/videos/<lang>/`, add the
pack to the `packs` array in `app.json`, uncomment its map in `deases.js`, and add an entry to
`languages`.

## Building

```bash
npx expo prebuild --platform android --clean   # regenerates android/ incl. the asset pack
npx expo run:android                           # dev build: packs are merged into the APK
eas build --platform android --profile production   # AAB with the asset pack
```

**Expo Go works on iOS but not Android.** Expo Go ships a fixed set of Expo modules and cannot
load custom native code at *any* SDK version. On iOS that does not matter — the videos are bundled
assets, served from the Metro dev server, so the app is fully testable in Expo Go. On Android the
`AssetPacks` module is missing in Expo Go, so `resolveVideoSource` returns `null` and every video
shows the unavailable panel; use `npx expo run:android` or an EAS development build there.

Note that offline playback is an Android production behaviour. In Expo Go the videos stream from
your computer, so pulling the network will stop them — that is the dev server going away, not a
bug in the asset pack.

Verified against Expo SDK 57 (React Native 0.86, React 19.2).

Local `assembleDebug`/`assembleRelease` APK builds merge asset pack assets into the APK, so the
same `file:///android_asset/…` paths work without going through Play.

### Verifying an AAB

```bash
unzip -l <app>.aab | grep urdu_videos        # pack present, 8 entries
bundletool build-apks --bundle=<app>.aab --output=out.apks --local-testing
bundletool install-apks --apks=out.apks      # installs base + asset pack splits
```

`--local-testing` matters: a plain `bundletool install-apks` can skip asset pack splits, which
makes the videos look missing on device for reasons that have nothing to do with this code.

## Limits worth knowing

- Install-time packs: **1 GB** total across all packs. The Urdu pack is 139 MB.
- Total download size for an app using PAD: 1.5 GB.
- Pack names must start with a letter and contain only letters, digits and underscores. The
  config plugin enforces this and fails the build early otherwise.

## iOS and other platforms

Play Asset Delivery is Android-only, so the video resolver is split by platform. Metro picks the
file matching the build target and never walks the other one:

| File | Used by | How videos are delivered |
| --- | --- | --- |
| `app/media/assetPackVideos.android.js` | Android | Play Asset Delivery install-time pack |
| `app/media/assetPackVideos.js` | iOS, web, Expo Go | bundled as ordinary React Native assets |

Both read from the same files in `asset-packs/urdu_videos/` — there is one copy on disk, only the
delivery mechanism differs, and `app/data/deases.js` stays the single source of truth for which
video belongs to which procedure.

The split is what keeps the Android APK lean. Because Metro never walks the iOS module when
building for Android, its `require()` calls do not pull the videos into the APK. Confirm after any
change to these files:

```bash
npx expo export --platform android   # asset list must contain no .mp4 (~3 MB total)
npx expo export --platform ios       # 8 mp4 assets (~142 MB total)
```

iOS therefore ships the videos inside the app, which is well under the App Store's size ceiling but
does make the download large. If that becomes a problem, Apple's On-Demand Resources tagged for
initial install is the closest equivalent to an install-time asset pack; it needs custom native
code and would replace this module.

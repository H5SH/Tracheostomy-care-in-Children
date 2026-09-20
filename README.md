# Tracheostomy Care

Video guidance for caring for a child with a tracheostomy at home. Expo (SDK 57) app, Android and
iOS. Videos play offline.

- **Content** — languages, UI text and procedures all live in **`app/data/content.json`**.
- **Videos** — live in **`asset-packs/<pack>/<videoDir>/`**, one pack per language.
- **Delivery** — Android uses Google Play Asset Delivery; iOS bundles the files. See
  [`docs/asset-delivery.md`](docs/asset-delivery.md).

```bash
npm install
npx expo start              # Expo Go works on iOS (see the caveat below)
npx expo run:android        # required on Android — Expo Go cannot load the native module
npm run check:content       # validate content.json against the files on disk
npm run check:bundles       # guard the Android/iOS split (slow, run before releasing)
```

> **Expo Go on Android will show every video as unavailable.** Expo Go cannot load custom native
> code, and Android reads videos through one. Use `npx expo run:android` or an EAS development
> build. iOS is fine in Expo Go because the videos are bundled assets — though they stream from the
> dev server there, so offline playback is only testable from an installed Android build.

---

## Directory structure

The layout is strict — the app discovers files by location, so a file in the wrong folder is
invisible.

```
app/
├── app.json                         # asset packs are declared here (one per language)
├── asset-packs/
│   ├── urdu_videos/videos/urdu/     # ← Urdu .mp4 files
│   └── english_videos/videos/english/
├── assets/                          # procedure thumbnails, logos (flat, not nested)
└── app/
    ├── data/
    │   ├── content.json             # ← the only file you normally edit
    │   └── catalog.js               # turns content.json into what screens render
    ├── i18n/LanguageProvider.jsx    # language state + t() lookup
    ├── media/
    │   ├── assetPackVideos.js       # iOS / web / Expo Go — bundles the videos
    │   └── assetPackVideos.android.js  # Android — reads the asset packs
    ├── screens/
    └── ui/                          # theme tokens + shared components
```

The rule for a language named `<lang>`: its pack is `asset-packs/<lang>_videos/` and its videos go
in `asset-packs/<lang>_videos/videos/<lang>/`. The two paths are `assetPack` and `videoDir` in
`content.json` and must agree with the folders on disk. `npm run check:content` enforces this.

---

## Adding a video to an existing language

No code changes.

1. Drop the `.mp4` into that language's folder, e.g.
   `asset-packs/urdu_videos/videos/urdu/NewProcedureUrdu.mp4`.
2. In `app/data/content.json`, find the procedure under `procedures` and add the filename under
   `videos`:

   ```json
   {
     "id": "hand-hygiene",
     "videos": {
       "english": "HandHygieneEnglish.mp4",
       "urdu": "HandHygieneUrdu.mp4"
     }
   }
   ```

   Just the **filename** — the folder comes from the language's `videoDir`.
3. `npm run check:content`
4. `npx expo prebuild --platform android --clean` to rebuild the asset pack.

### Adding a whole new procedure

Add an entry to `procedures`. Every field except `videos` is required:

```json
{
  "id": "suction-technique",
  "image": "trachealSuctioning.jpg",
  "title":       { "english": "Suction technique", "urdu": "سکشن کا طریقہ" },
  "description": { "english": "…",                 "urdu": "…" },
  "videos":      { "english": "SuctionEnglish.mp4" }
}
```

- `id` must be unique and never change — it is what navigation passes around.
- `image` is a filename in `assets/`, flat, no subfolder.
- A procedure only appears in a language it has a video for. The example above shows in English
  and is hidden in Urdu until an Urdu file is added.

---

## Adding a language

Example: adding Punjabi.

**1. Create the folders**, following the naming rule exactly:

```bash
mkdir -p asset-packs/punjabi_videos/videos/punjabi
cp /path/to/*.mp4 asset-packs/punjabi_videos/videos/punjabi/
```

**2. Add the language** to `languages` in `content.json`:

```json
{
  "key": "punjabi",
  "label": "ਪੰਜਾਬੀ",
  "englishName": "Punjabi",
  "direction": "ltr",
  "videoDir": "videos/punjabi",
  "assetPack": "punjabi_videos"
}
```

`direction` is `rtl` for right-to-left scripts (Urdu, Arabic) and `ltr` otherwise. `label` is what
appears on the language buttons — write it in the language itself.

**3. Add its UI strings** — copy the whole `ui.english` block to `ui.punjabi` and translate. Any
key you leave out falls back to `fallbackLanguage`, and `npm run check:content` lists what's
missing, so you can ship a partial translation and finish later.

**4. Add its videos and titles** to the procedures it covers:

```json
"title":  { "english": "Hand hygiene", "punjabi": "ਹੱਥਾਂ ਦੀ ਸਫ਼ਾਈ" },
"videos": { "english": "HandHygieneEnglish.mp4", "punjabi": "HandHygienePunjabi.mp4" }
```

**5. Declare the asset pack** in `app.json` under `./plugins/withAndroidAssetPacks`:

```json
{ "name": "punjabi_videos", "sourceDir": "./asset-packs/punjabi_videos", "deliveryType": "install-time" }
```

This is the one edit outside `content.json`. It exists because Gradle needs the pack declared at
build time. `check:content` fails if you forget it.

**6. Verify and rebuild:**

```bash
npm run check:content
npx expo prebuild --platform android --clean
```

The language now appears on the welcome screen and on any procedure it has a video for. No code
changes.

### To make a different language the default

Change `defaultLanguage` in `content.json`. `fallbackLanguage` is what partial translations fall
back to — keep that on a complete language.

---

## How language affects the UI

- **Welcome screen** — the only place language is chosen. The app opens in `defaultLanguage`
  every launch; there is no storage dependency in this project, so the choice is not remembered.
  The layout is fixed, so switching language never moves the buttons.
- **Procedures list** — shows only procedures with a video in the selected language. Switching
  language changes the list, which is why "Introduction" appears in English but not Urdu.
- **Video screen** — plays the current language and offers no switch of its own. Because the list
  is already filtered, a procedure you can open always has a video.
- **Right-to-left** — Urdu text aligns right and rows mirror. This is done per-component rather
  than through `I18nManager.forceRTL`, which only takes effect after an app restart; the trade-off
  is that switching applies instantly.

---

## Before you release

```bash
npm run check:content    # content.json matches the files on disk
npm run check:bundles    # Android ships no videos, iOS ships all of them
npx expo-doctor          # dependency and config health
```

`check:bundles` is the important one. Videos must only ever be `require()`d from
`app/media/assetPackVideos.js`, which Android never loads. A stray `require()` of an `.mp4` in
shared code would silently add every video to the Android APK.

Android build: see [`docs/asset-delivery.md`](docs/asset-delivery.md) — you need an **`.aab`**
(`eas build --platform android --profile production`). A plain APK does not contain asset packs.

## Translations need review

The Urdu strings and procedure descriptions in `content.json` were machine-translated and have
**not** been checked by a clinician or a native speaker. Review them before this reaches families.

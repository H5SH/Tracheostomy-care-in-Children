# Tracheostomy Care

Video guidance for caring for a child with a tracheostomy at home. Expo (SDK 57) app, Android and
iOS. Videos play offline.

- **Content** — languages, UI text and procedures all live in **`app/data/content.json`**.
- **Media** — **one silent video per procedure** in `asset-packs/videos/videos/`, and **one
  narration file per language** in `asset-packs/audios/audios/<language>/`. Switching language
  swaps the audio; the picture is the same file for everyone.
- **Delivery** — Android uses Google Play Asset Delivery; iOS bundles the files. See
  [`docs/asset-delivery.md`](docs/asset-delivery.md).

### Why picture and narration are separate files

A language used to mean a whole extra copy of the video, about 170 MB. Twenty-six languages that
way is over 4 GB — past Play's install-time budget and unshippable on iOS. Sharing one video and
adding only narration costs about 4 MB per language for all nine procedures, so **26 languages
ship in 278 MB, less than the 321 MB two languages used to take**.

Keeping them as separate files rather than one multi-track MP4 costs a little sync work at
playback and buys the ability to replace one language's narration by dropping in a file — which
matters while these translations are still being reviewed.

The video stream is copied (`-c:v copy`), never re-encoded, so the picture is byte-identical to
what shipped before; stripping its audio track is the only change.

```
app/
├── app.json                         # the single `videos` asset pack is declared here
├── asset-packs/
│   ├── videos/videos/               # ← one silent .mp4 per procedure (the picture)
│   └── audios/audios/<language>/    # ← one .m4a per language per procedure (the narration)
├── build/                           # audio-pipeline intermediates (gitignored)
├── scripts/audio/                   # the transcribe → translate → synthesise → mux pipeline
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

A procedure names its video and which languages it has narration for:

```json
{
  "id": "hand-hygiene",
  "video": "hand-hygiene.mp4",
  "audio": ["english", "urdu", "hindi", "arabic", "…"]
}
```

Narration is found by convention — `audios/<language>/<procedure id>.m4a` — so `audio` is just the
list of languages that have one. `npm run check:content` verifies every listed file exists, and
fails if a video still contains an audio track (dead weight shipped once per procedure, and it
would play underneath the narration).

---

## Adding narration for a language

No code changes. The pipeline in `scripts/audio/` does the work:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node scripts/audio/1-transcribe.js      # English narration -> timed sentences (cached)
node scripts/audio/2-translate.js       # -> build/scripts/<language>/
node scripts/audio/3-synthesize.js      # -> build/audio/<language>/  (one track per procedure)
node scripts/audio/4-package.js         # rebuild asset-packs/videos + audios + manifest
npm run check:content
```

Each step skips work it has already done, so re-running is cheap. To redo one language, delete its
folder under `build/` and run again.

`4-package.js` writes `build/manifest.json` with the exact track order per procedure — copy that into
`content.json` (`video` and `audio` per procedure) whenever the language list changes.

### Where narration comes from

- **English and Urdu** are human recordings, extracted from the original videos and never
  synthesised. Those originals have been removed from the working tree now that the narration is
  extracted — `git log -- asset-packs/english_videos` finds them if a video ever needs rebuilding.
- **Hindi** reuses the Urdu recording — spoken Urdu and Hindi are the same language to listen to,
  so a real voice beats a synthetic one. The Hindi *text* in the app is still Devanagari. See
  `SHARED_NARRATION` in `scripts/audio/lib.js`.
- **Everything else** is Google Chirp 3 HD, time-fitted so each sentence is spoken while the action
  it describes is on screen. `3-synthesize.js` reports any sentence it could not fit.

## Adding a language

**1. Add the language** to `languages` in `content.json`:

```json
{
  "key": "punjabi",
  "code": "PA",
  "translateCode": "pa",
  "ttsCode": "pa-IN",
  "audioTag": "pan",
  "locales": ["pa"],
  "label": "ਪੰਜਾਬੀ",
  "englishName": "Punjabi",
  "direction": "ltr"
}
```

- `code` — **exactly two uppercase letters**, unique. Rendered inside the welcome-screen circles,
  so anything longer overflows them. Use the ISO 639-1 code.
- `translateCode` / `ttsCode` — what the Google Translation and Text-to-Speech APIs expect. Not
  every language has a voice; check before promising one.
- `audioTag` — ISO 639-2, written into the MP4 audio track.
- `locales` — device locales that auto-select this language, matched on the primary subtag.
- `direction` — `rtl` for Arabic, Hebrew, Urdu; `ltr` otherwise.
- `label` — the language's own name. Not on the circles, but it is what screen readers announce.

**2. Translate the interface:** `npm run translate`

**3. Add narration:** run the audio pipeline above, then update `content.json` from the manifest.

A language with no narration is still worth adding: it is translated, selectable, and plays the
fallback language's track with a "Narrated in English" note under the video.

**4. Verify:**

```bash
npm run check:content
npx expo prebuild --platform android --clean
```

### To make a different language the default

`defaultLanguage` is the **startup fallback** — what the app opens in when the device's locale
matches no language's `locales`. It is not an unconditional default; a device set to Urdu opens
in Urdu regardless. Keep it on a language with a complete set of videos.

`fallbackLanguage` is a different thing: what a missing UI string or title falls back to. Keep
that on a complete translation.

---

## How language affects the UI

- **Welcome screen** — the only place language is chosen. On launch the app walks the device's
  **preferred-language list in order** (via `expo-localization`) and opens in the first one that
  matches a language's `locales`, falling back to `defaultLanguage` (English). There is no
  storage dependency in this project, so a manual switch lasts for the session only and the next
  launch detects again.

  In a dev build you can see the decision in the console:
  `[i18n] device prefers [ur, en] -> "urdu"`.

  > Do **not** replace this with `Intl.DateTimeFormat().resolvedOptions().locale`. That reports
  > the locale the app *resolved to*, not the user's preference: on iOS an app is only handed a
  > language it declares in its bundle, so inside Expo Go a phone set to Urdu reports `en` and
  > the app always opened in English. See `app/i18n/deviceLanguage.js`.
- **The language switcher** is two circles: the code in use (`EN`) and a `+N` that opens a
  horizontally scrollable strip of every language. Picking one switches the app immediately and
  collapses the strip. Both states are one row of 48pt circles, so the control never changes
  height and the button below it cannot move.
- **Procedures list** — shows only procedures that have narration in the selected language. Urdu
  and Hindi therefore show eight rather than nine: neither has a recording for the introduction.

  An earlier version played the English recording in that case. It tested badly — the
  introduction is the first card in the list, so an Urdu user's first tap produced English
  narration with no warning. Eight procedures that all speak your language beat nine where one
  surprises you. Give Urdu an `introduction.m4a` and the ninth appears by itself.
- **Video screen** — plays the current language and offers no switch of its own. Because the list
  is already filtered, a procedure you can open always has a video.
- **Right-to-left** — Urdu text aligns right and rows mirror. This is done per-component rather
  than through `I18nManager.forceRTL`, which only takes effect after an app restart; the trade-off
  is that switching applies instantly.

---

## Playback: two players, one clock

The picture and the narration are separate files, so `MedVideo.jsx` runs `expo-video` (muted) and
`expo-audio` together. Three things there are load-bearing and easy to undo by accident:

- **Playback waits for the narration to load.** Starting the video on mount is what made the audio
  come in late — the video was seconds in before the audio was ready. Both now start together,
  which costs a beat before the first frame.
- **Only one seek is ever in flight.** `seekTo` is async, and `currentTime` keeps reporting the old
  position until it resolves. Without a guard, every tick sees the same drift and queues another
  seek; on a device that becomes a seek storm that stutters the audio and blocks touches. A
  cooldown between corrections backs it up.
- **Corrections are rare by design.** Measured drift is 0.04–0.06s and does not accumulate, so the
  0.25s tolerance means roughly one correction per ten seconds. A correction is an audible jump in
  speech — tolerating a little slip is better than chasing zero.

`npm run check:refs` catches identifiers used but never defined. Babel compiles those happily and
they only fail on the device, which is exactly how a stale reference survived a clean build here.

## Before you release

```bash
npm run check:refs       # no identifiers used but never defined
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

**Every language except English is machine output and has not been checked by a clinician or a
native speaker.** That is 24 languages added in bulk via `npm run translate`, plus the original
Urdu. Review before this reaches families — these are paediatric airway instructions, and a
mistranslated pressure or duration can cause harm.

The translator never overwrites an existing value, so reviewed text is safe from later runs.
Review one language at a time and commit it; `--force` is the only way to lose that work, which
is why it refuses to run without `--only=`.

Known rough edges the machine produced, as examples of what to look for: titles that came back as
imperative sentences with a full stop rather than noun phrases, inconsistent transliteration of
"tracheostomy", and occasional English left in Latin script mid-sentence.

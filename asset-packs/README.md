# Asset packs

Each subdirectory is the source of one Google Play Asset Delivery pack. Its contents are mirrored
verbatim into `android/<packName>/src/main/assets/` during `expo prebuild`, so the tree here *is*
the pack's asset namespace:

    asset-packs/videos/videos/hand-hygiene.mp4        ->  "videos/hand-hygiene.mp4"
    asset-packs/audios/audios/german/hand-hygiene.m4a ->  "audios/german/hand-hygiene.m4a" 

Packs are declared in `app.json` under the `./plugins/withAndroidAssetPacks` entry. Dotfiles
(`.DS_Store` and friends) are skipped and never reach the bundle.

Read the videos with `app/media/assetPackVideos.js`. Full details in `docs/asset-delivery.md`.

## What's here

| Directory | What it is |
| --- | --- |
| `videos/` | One silent `.mp4` per procedure — the picture, shared by every language |
| `audios/` | `audios/<language>/<procedure>.m4a` — one narration file per language |

Both are declared in `app.json` and both ship. `assetPackVideos.js` scopes its `require.context`
calls to these two directories, so nothing else placed under `asset-packs/` would be bundled by
accident; `npm run check:bundles` fails if that ever regresses.

The original per-language recordings that the narration was extracted from are no longer in the
working tree. They are in git history (`git log -- asset-packs/english_videos`) and are only
needed if a video has to be rebuilt from source.

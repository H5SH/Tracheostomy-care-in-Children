# Asset packs

Each subdirectory is the source of one Google Play Asset Delivery pack. Its contents are mirrored
verbatim into `android/<packName>/src/main/assets/` during `expo prebuild`, so the tree here *is*
the pack's asset namespace:

    asset-packs/urdu_videos/videos/urdu/Foo.mp4  ->  "videos/urdu/Foo.mp4" at runtime

Packs are declared in `app.json` under the `./plugins/withAndroidAssetPacks` entry. Dotfiles
(`.DS_Store` and friends) are skipped and never reach the bundle.

Read the videos with `app/media/assetPackVideos.js`. Full details in `docs/asset-delivery.md`.

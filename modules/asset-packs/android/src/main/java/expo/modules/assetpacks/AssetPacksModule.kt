package expo.modules.assetpacks

import android.content.res.AssetManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException

/**
 * Reads files that ship inside a Google Play Asset Delivery *install-time* asset pack.
 *
 * Play merges an install-time pack into the app's own asset space at install time, so the
 * files are reachable through the ordinary [AssetManager] and through the
 * `file:///android_asset/` URI scheme that media3/ExoPlayer understands. That means there is
 * nothing to download, nothing to unpack and no Play Core `AssetPackManager` call needed —
 * `AssetPackManager` only has something to say about fast-follow/on-demand packs, whose files
 * land on the filesystem instead.
 *
 * Paths are relative to the pack's `src/main/assets` directory, e.g. `videos/urdu/Foo.mp4`.
 */
private const val ANDROID_ASSET_URI_PREFIX = "file:///android_asset/"

class AssetPacksModule : Module() {
  private val assets: AssetManager
    get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).assets

  override fun definition() = ModuleDefinition {
    Name("AssetPacks")

    Constants(
      "assetUriPrefix" to ANDROID_ASSET_URI_PREFIX
    )

    /** True when [assetPath] resolves to a readable file in the merged asset space. */
    Function("assetExists") { assetPath: String ->
      assetExists(normalize(assetPath))
    }

    /**
     * A playable/openable URI for [assetPath], or `null` when the file is not present —
     * which is what you get if the asset pack was stripped from the install.
     */
    Function("getAssetUri") { assetPath: String ->
      val path = normalize(assetPath)
      if (assetExists(path)) ANDROID_ASSET_URI_PREFIX + path else null
    }

    /**
     * Every file under [directory], recursively, as paths relative to the asset root.
     *
     * `AssetManager` cannot tell an empty directory from a file, so a directory containing
     * no entries is reported as a file. Real asset packs never contain empty directories
     * (they carry no bytes and are dropped at build time), so this is not a practical concern.
     */
    Function("listAssets") { directory: String ->
      val results = mutableListOf<String>()
      collectAssets(normalize(directory), results)
      results.sorted()
    }
  }

  /** Accept `videos/x.mp4`, `/videos/x.mp4` and `file:///android_asset/videos/x.mp4` alike. */
  private fun normalize(assetPath: String): String =
    assetPath.removePrefix(ANDROID_ASSET_URI_PREFIX).trim('/')

  private fun assetExists(assetPath: String): Boolean =
    if (assetPath.isEmpty()) {
      false
    } else {
      try {
        assets.open(assetPath).close()
        true
      } catch (e: IOException) {
        false
      }
    }

  private fun collectAssets(directory: String, into: MutableList<String>) {
    val children = try {
      assets.list(directory)
    } catch (e: IOException) {
      null
    } ?: return

    for (child in children) {
      val childPath = if (directory.isEmpty()) child else "$directory/$child"
      val grandChildren = try {
        assets.list(childPath)
      } catch (e: IOException) {
        null
      }

      if (grandChildren.isNullOrEmpty()) {
        into.add(childPath)
      } else {
        collectAssets(childPath, into)
      }
    }
  }
}

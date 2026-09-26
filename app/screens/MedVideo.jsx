import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { procedureFor } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageProvider';
import { resolveAudioSource, resolveVideoSource } from '../media/assetPackVideos';
import { Screen } from '../ui/components';
import { colors, radius, shadow, spacing, type } from '../ui/theme';

function MedVideo({ route }) {
  const { procedureId } = route.params;
  const insets = useSafeAreaInsets();
  const { t, language, languageKey, textStyle, rowDirection } = useLanguage();

  // The language is chosen on the welcome screen and applies app-wide, so this screen just
  // plays whatever the current language has.
  const procedure = useMemo(
    () => procedureFor(procedureId, languageKey),
    [procedureId, languageKey]
  );

  const playingVideo = useMemo(() => resolveVideoSource(procedure?.video), [procedure]);
  const playingAudio = useMemo(() => resolveAudioSource(procedure?.audio), [procedure]);

  /**
   * Picture and narration are separate files, so two players have to be kept together.
   *
   * The video carries no audio track at all — one silent copy serves every language — and the
   * narration comes from `audios/<language>/`. The video is the clock; the narration is nudged
   * back into line when it wanders, which also covers the loop, where the video jumps to zero.
   */
  const player = useVideoPlayer(playingVideo, (player) => {
    player.loop = true;
    player.muted = true;
    // Once per second is enough to catch drift and keeps traffic off the bridge. At the old
    // half-second it was issuing twice the seeks for no benefit.
    player.timeUpdateEventInterval = 1;
  });

  const audio = useAudioPlayer(playingAudio);
  const audioStatus = useAudioPlayerStatus(audio);
  const audioReady = Boolean(playingAudio) && audioStatus?.isLoaded;

  /**
   * How far the narration may wander before it is pulled back. Generous on purpose: a correction
   * is an audible jump in speech, so it is worth tolerating a fifth of a second of slip to avoid
   * one. Sync is measured and reported in `docs/`.
   */
  const SYNC_TOLERANCE = 0.25;
  /** Never correct more often than this, whatever the drift says. */
  const SYNC_COOLDOWN_MS = 1500;

  const seeking = useRef(false);
  const lastSeekAt = useRef(0);

  /**
   * Pulls the narration back to the video's clock.
   *
   * The guards matter more than the threshold. `seekTo` is asynchronous, and until it resolves
   * `currentTime` still reports the old position — so a naive check sees the same drift on the
   * next tick and queues another seek. On a device that becomes a seek storm: the narration
   * stutters and the JS thread is busy enough that taps stop registering. One seek in flight at a
   * time, and a cooldown between them, is what stops it.
   */
  const syncAudio = useCallback(
    (videoTime, { force = false } = {}) => {
      if (!playingAudio || seeking.current) return;

      const now = Date.now();
      if (!force && now - lastSeekAt.current < SYNC_COOLDOWN_MS) return;
      if (!force && Math.abs(videoTime - audio.currentTime) <= SYNC_TOLERANCE) return;

      seeking.current = true;
      lastSeekAt.current = now;
      Promise.resolve(audio.seekTo(videoTime))
        .catch(() => {})
        .finally(() => {
          seeking.current = false;
        });
    },
    [audio, playingAudio]
  );

  /**
   * Starts both together, once the narration is actually loaded.
   *
   * Playing the video the moment it mounts is what made the narration come in late: the video was
   * already seconds in before the audio had finished loading, and the first correction only
   * arrived on the next tick. Waiting costs a beat before playback begins and starts them in step.
   */
  useEffect(() => {
    if (!playingVideo) return;

    if (!playingAudio) {
      player.play();
      return;
    }
    if (!audioReady) return;

    player.currentTime = 0;
    Promise.resolve(audio.seekTo(0))
      .catch(() => {})
      .finally(() => {
        audio.play();
        player.play();
      });
  }, [playingVideo, playingAudio, audioReady]);

  useEffect(() => {
    if (!playingAudio) return undefined;

    const onTime = player.addListener('timeUpdate', ({ currentTime }) => syncAudio(currentTime));
    const onPlaying = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        audio.play();
        syncAudio(player.currentTime, { force: true });
      } else {
        audio.pause();
      }
    });

    return () => {
      onTime?.remove?.();
      onPlaying?.remove?.();
    };
  }, [player, audio, playingAudio, syncAudio]);

  useEffect(() => {
    if (playingVideo) {
      player.replace(playingVideo);
    } else {
      player.pause();
      player.replace(null);
    }
  }, [playingVideo]);

  // Leaving the screen must stop the narration; the video player is torn down for us, but the
  // audio player outlives the frame it was created in if nothing says otherwise.
  useEffect(
    () => () => {
      try {
        audio.pause();
      } catch {
        // Already released.
      }
    },
    [audio]
  );

  return (
    <Screen gutter={false}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        {/* Flexes to fill whatever the text below does not use, so the screen is full without
            ever scrolling. `contentFit="contain"` means the video is never cropped. */}
        <View
          style={[
            {
              flex: 1,
              // A flex item will not shrink below its content's intrinsic size unless told to,
              // and the video's intrinsic size is its full 720x1280. Without this the box grows
              // to 1429px on a 390px-tall landscape screen and the picture runs off the bottom.
              minHeight: 0,
              width: '100%',
              borderRadius: radius.lg,
              backgroundColor: colors.videoBg,
              overflow: 'hidden',
            },
            shadow(2),
          ]}
        >
          {playingVideo ? (
            <VideoView
              player={player}
              // `flex: 1` rather than `height: '100%'`: the parent is flex-sized with no explicit
              // height, so a percentage height has nothing to resolve against and the view grows
              // to the video's own aspect ratio instead of the box it is in. Portrait hid it —
              // the natural height was close enough — but in landscape the picture overflowed the
              // screen and pushed the title out of view.
              // `minHeight: 0` as well as `flex: 1`: a flex item refuses to shrink below its
              // content's intrinsic size by default, and this one's content is a 720x1280 frame.
              // Without it the video stayed 1429px tall on a 390px landscape screen.
              style={{ flex: 1, minHeight: 0 }}
              contentFit="contain"
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.xl,
                gap: spacing.md,
              }}
            >
              <Ionicons name="film-outline" size={30} color={colors.mintDeep} />
              <Text style={[type.body, { color: colors.mint, textAlign: 'center', fontSize: 14 }]}>
                {t('video.unavailable', { language: language.label })}
              </Text>
            </View>
          )}
        </View>

        {!!procedure && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[type.title, textStyle]}>{procedure.title}</Text>
            {!!procedure.description && (
              // Capped so an unusually long description cannot squeeze the player or force
              // the screen to scroll.
              <Text
                numberOfLines={4}
                style={[type.body, { marginTop: spacing.sm }, textStyle]}
              >
                {procedure.description}
              </Text>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

export default MedVideo;

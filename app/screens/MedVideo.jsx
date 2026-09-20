import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { VideoView, useVideoPlayer } from 'expo-video';

import { procedureFor } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageProvider';
import { resolveVideoSource } from '../media/assetPackVideos';
import { Screen } from '../ui/components';
import { colors, radius, shadow, spacing, type } from '../ui/theme';

function MedVideo({ route }) {
  const { procedureId } = route.params;
  const insets = useSafeAreaInsets();
  const { t, language, languageKey, textStyle } = useLanguage();

  // The language is chosen on the welcome screen and applies app-wide, so this screen just
  // plays whatever the current language has.
  const procedure = useMemo(
    () => procedureFor(procedureId, languageKey),
    [procedureId, languageKey]
  );

  const playingVideo = useMemo(() => resolveVideoSource(procedure?.video), [procedure]);

  const player = useVideoPlayer(playingVideo, (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    if (playingVideo) {
      player.replace(playingVideo);
      player.play();
    } else {
      player.pause();
      player.replace(null);
    }
  }, [playingVideo]);

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
              style={{ width: '100%', height: '100%' }}
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

import React from 'react';
import { Dimensions, Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { proceduresFor } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  AppButton,
  Blob,
  Eyebrow,
  FadeInView,
  FeatureRow,
  Screen,
  TogglePill,
} from '../ui/components';
import { colors, leading, radius, shadow, spacing, type } from '../ui/theme';

const { width } = Dimensions.get('window');

// The subtitle wraps to a different number of lines in each language. Reserving three lines'
// worth of space keeps everything below it — features, language pills, button — from moving
// when the language is switched.
const TITLE_FONT_SIZE = 34;
const SUBTITLE_FONT_SIZE = 16;
const SUBTITLE_MIN_HEIGHT = leading(SUBTITLE_FONT_SIZE) * 3;

function Welcome({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, languageKey, languages, setLanguage, textStyle, rowDirection } = useLanguage();

  const procedureCount = proceduresFor(languageKey).length;

  return (
    <Screen gutter={false}>
      {/* Soft mint shapes stand in for a gradient, so no extra native dependency. */}
      <Blob size={width * 1.1} color={colors.mint} style={{ top: -width * 0.55, right: -width * 0.3 }} />
      <Blob size={width * 0.8} color={colors.mintDeep} style={{ bottom: -width * 0.35, left: -width * 0.3 }} />

      {/* flexGrow on the container plus a non-shrinking hero below gives both behaviours:
          on a normal phone the hero expands and the button sits on the bottom edge; on a short
          screen nothing is squashed and the page scrolls instead. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        {/* Hero is top-anchored and flexes, so slack collects here rather than shifting the
            block below. The language switch and button stay put in every language. */}
        <View style={{ flexGrow: 1, flexShrink: 0 }}>
          <FadeInView>
            <View
              style={[
                {
                  width: 92,
                  height: 92,
                  borderRadius: radius.xl,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                },
                shadow(2),
              ]}
            >
              <Image
                source={require('../../assets/FAHSIcon.png')}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>

            <Eyebrow style={{ marginBottom: spacing.md }}>{t('welcome.eyebrow')}</Eyebrow>

            {/* content.json puts an explicit line break in this string, so it is always two
                lines and never changes height between languages. */}
            <Text
              style={[
                type.display,
                { fontSize: TITLE_FONT_SIZE, lineHeight: leading(TITLE_FONT_SIZE) },
                textStyle,
              ]}
            >
              {t('welcome.title')}
            </Text>

            <Text
              style={[
                type.body,
                {
                  fontSize: SUBTITLE_FONT_SIZE,
                  lineHeight: leading(SUBTITLE_FONT_SIZE),
                  marginTop: spacing.md,
                  minHeight: SUBTITLE_MIN_HEIGHT,
                },
                textStyle,
              ]}
            >
              {t('welcome.subtitle')}
            </Text>
          </FadeInView>

          <FadeInView delay={110} style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <FeatureRow icon="videocam" label={t('welcome.feature.procedures', { count: procedureCount })} />
            <FeatureRow icon="cloud-offline" label={t('welcome.feature.offline')} />
            <FeatureRow icon="chatbubble-ellipses" label={t('welcome.feature.narration')} />
          </FadeInView>
        </View>

        {/* Anchored to the bottom of the screen in every language. */}
        <FadeInView delay={220}>
          <Eyebrow style={{ marginBottom: spacing.md }}>{t('welcome.language')}</Eyebrow>
          <View
            style={{
              flexDirection: rowDirection,
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            {languages.map((item) => (
              <TogglePill
                key={item.key}
                label={item.label}
                selected={item.key === languageKey}
                onPress={() => setLanguage(item.key)}
              />
            ))}
          </View>

          <AppButton
            label={t('welcome.cta')}
            icon="arrow-forward"
            onPress={() => navigation.navigate('List')}
          />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

export default Welcome;

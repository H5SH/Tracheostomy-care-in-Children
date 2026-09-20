import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { resourcesFor } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageProvider';
import { PageHeading, Screen } from '../ui/components';
import { colors, radius, shadow, spacing, type } from '../ui/theme';

async function openLink(url) {
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to the alert below
  }
  Alert.alert('Cannot open link', 'No app on this device can open this page.');
}

function ResourceCard({ title, description, url }) {
  const { t, textStyle, rowDirection, isRTL } = useLanguage();

  return (
    <Pressable
      onPress={() => openLink(url)}
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${t('links.opens')}`}
      style={({ pressed }) => [
        {
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: pressed ? colors.mint : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow(1),
      ]}
    >
      <View style={{ flexDirection: rowDirection, alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          {/* Institution names stay in their own language. */}
          <Text style={type.heading}>{title}</Text>
          <Text style={[type.body, { marginTop: spacing.xs + 2 }, textStyle]}>{description}</Text>
        </View>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.sm,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isRTL ? 'arrow-back' : 'arrow-forward'}
            size={17}
            color={colors.accent}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 5,
          marginTop: spacing.md,
        }}
      >
        <Ionicons name="open-outline" size={13} color={colors.inkFaint} />
        <Text style={type.caption}>{t('links.opens')}</Text>
      </View>
    </Pressable>
  );
}

function Links() {
  const { t, languageKey } = useLanguage();
  const resources = useMemo(() => resourcesFor(languageKey), [languageKey]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeading
          eyebrow={t('links.eyebrow')}
          title={t('links.title')}
          subtitle={t('links.subtitle')}
          style={{ paddingBottom: spacing.xl }}
        />

        <View style={{ gap: spacing.md }}>
          {resources.map((resource) => (
            <ResourceCard key={resource.id} {...resource} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

export default Links;

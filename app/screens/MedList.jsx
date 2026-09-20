import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { proceduresFor } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageProvider';
import { AppButton, PageHeading, ProcedureCard, Screen } from '../ui/components';
import { spacing, type } from '../ui/theme';

function MedList({ navigation }) {
  const { t, languageKey, textStyle } = useLanguage();

  // Only procedures that actually have a video in the selected language.
  const procedures = useMemo(() => proceduresFor(languageKey), [languageKey]);

  const renderItem = ({ item }) => (
    <ProcedureCard
      title={item.title}
      image={item.image}
      caption={t('card.watch')}
      onPress={() => navigation.navigate('Video', { procedureId: item.id })}
    />
  );

  return (
    <Screen>
      <FlashList
        data={procedures}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        extraData={languageKey}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListHeaderComponent={
          <PageHeading
            eyebrow={t('list.eyebrow')}
            title={t('list.title')}
            subtitle={t('list.subtitle')}
            style={{ paddingTop: spacing.sm, paddingBottom: spacing.xl }}
          />
        }
        ListEmptyComponent={
          <Text style={[type.body, textStyle, { paddingVertical: spacing.xl }]}>
            {t('list.empty')}
          </Text>
        }
        ListFooterComponent={
          <AppButton
            variant="secondary"
            label={t('list.resources')}
            icon="open-outline"
            onPress={() => navigation.navigate('Links')}
            style={{ marginTop: spacing.xl }}
          />
        }
      />
    </Screen>
  );
}

export default MedList;

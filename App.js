import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './app/i18n/LanguageProvider';
import MainStack from './app/navigation/MainStack';
import { colors } from './app/ui/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={colors.canvas} />
        <LanguageProvider>
          <MainStack />
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

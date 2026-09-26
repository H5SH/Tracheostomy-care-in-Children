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
        {/* No `backgroundColor`: it routes to Android's `Window.setStatusBarColor`, which is
            deprecated from Android 15 and flagged by the Play Console. The build is already
            edge-to-edge (`edgeToEdgeEnabled` in gradle.properties), so the bar is transparent and
            the canvas behind it shows through — the appearance is unchanged. */}
        <StatusBar style="dark" />
        <LanguageProvider>
          <MainStack />
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

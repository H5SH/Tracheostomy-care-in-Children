import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { useLanguage } from '../i18n/LanguageProvider';
import Welcome from '../screens/Welcome';
import MedList from '../screens/MedList';
import MedVideo from '../screens/MedVideo';
import Links from '../screens/Links';
import { colors } from '../ui/theme';

const Stack = createStackNavigator();

const navigationTheme = {
  dark: false,
  colors: {
    primary: colors.accent,
    background: colors.canvas,
    card: colors.canvas,
    text: colors.ink,
    border: 'transparent',
    notification: colors.accent,
  },
};

const MainStack = () => {
  // Read inside the component so header titles re-render when the language changes.
  const { t } = useLanguage();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.accent,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            color: colors.ink,
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          cardStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
        <Stack.Screen name="List" component={MedList} options={{ title: t('nav.list') }} />
        <Stack.Screen name="Video" component={MedVideo} options={{ title: t('nav.video') }} />
        <Stack.Screen name="Links" component={Links} options={{ title: t('nav.links') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainStack;

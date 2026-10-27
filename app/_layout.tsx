import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium_Italic, Inter_600SemiBold_Italic, Inter_700Bold_Italic } from '@expo-google-fonts/inter';
import { LangProvider } from '../src/i18n';
import { StoreProvider } from '../src/store';
import { ThemeProvider, Themed } from '../src/themeContext';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium_Italic, Inter_600SemiBold_Italic, Inter_700Bold_Italic
  });
  // Lets people add the site to their phone's home screen like an app (web only).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const base = process.env.EXPO_PUBLIC_BASE_URL || '';
    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    };
    add('link', { rel: 'manifest', href: `${base}/manifest.webmanifest` });
    add('link', { rel: 'apple-touch-icon', href: `${base}/apple-touch-icon.png` });
    add('meta', { name: 'theme-color', content: '#C8202F' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  }, []);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.skyTop }} />;
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.skyTop }}>
        <LangProvider>
          <StoreProvider>
            <Themed>
              <StatusBar style={colors.light ? 'dark' : 'light'} />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.skyTop }, animation: 'fade' }} />
            </Themed>
          </StoreProvider>
        </LangProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

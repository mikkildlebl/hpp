import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { SessionProvider } from '@/lib/SessionContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = useTheme();

  return (
    <ThemeProvider value={theme}>
      <SessionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ title: 'Högskoleprovet Practice' }} />
          <Stack.Screen name="session/[type]" options={{ title: 'Practice' }} />
          <Stack.Screen name="session/summary" options={{ title: 'Results' }} />
          <Stack.Screen name="glossary/index" options={{ title: 'Ordbank' }} />
        </Stack>
      </SessionProvider>
    </ThemeProvider>
  );
}

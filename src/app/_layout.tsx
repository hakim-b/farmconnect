import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/use-auth';
import { ProfileProvider } from '@/hooks/use-profile';
import { CartProvider } from '@/lib/cart';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ProfileProvider>
          <CartProvider>
            <HeroUINativeProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <AnimatedSplashOverlay />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="welcome" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="role-select" />
                  <Stack.Screen name="farm-setup" />
                  <Stack.Screen name="vendor-item" options={{ presentation: 'card' }} />
                  <Stack.Screen name="vendor-slot" options={{ presentation: 'card' }} />
                  <Stack.Screen name="(customer)" />
                  <Stack.Screen name="(vendor)" />
                  <Stack.Screen
                    name="farm/[id]"
                    options={{ headerShown: true, title: 'Farm', headerBackTitle: 'Back' }}
                  />
                </Stack>
              </ThemeProvider>
            </HeroUINativeProvider>
          </CartProvider>
        </ProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

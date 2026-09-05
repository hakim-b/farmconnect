import { useAuth, useClerk } from '@clerk/expo';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import * as AuthSession from 'expo-auth-session';
import { Redirect } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type AuthMode = 'sign-in' | 'sign-up';

// The deep-link callback must land on a route that exists, or expo-router
// throws "Unmatched route". welcome auto-redirects signed-in users to "/".
const HOSTED_AUTH_REDIRECT_URL = AuthSession.makeRedirectUri({
  path: 'welcome',
  isTripleSlashed: true,
});

export default function WelcomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { startHostedAuth } = useHostedAuth();

  const handleAuth = async (mode: AuthMode) => {
    if (Platform.OS === 'web') {
      // Hosted auth via expo-web-browser is native-only. On web the browser
      // navigates straight to Clerk's Account Portal instead.
      if (mode === 'sign-up') await clerk.redirectToSignUp();
      else await clerk.redirectToSignIn();
      return;
    }

    await startHostedAuth({ mode, redirectUrl: HOSTED_AUTH_REDIRECT_URL });
  };

  if (isLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <ThemedText type="smallBold" style={styles.kicker}>
          Local farms, one place
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          FarmConnect
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lede}>
          Buy produce and meats, book slaughter appointments, and find farm activities — without
          hunting through WhatsApp groups.
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="smallBold">Get started</ThemedText>
        <Button onPress={() => handleAuth('sign-up')}>Create an account</Button>
        <Button variant="secondary" onPress={() => handleAuth('sign-in')}>
          Sign in
        </Button>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.six,
  },
  kicker: {
    color: '#2F6B3A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 44,
    lineHeight: 48,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    marginBottom: Spacing.four,
  },
});

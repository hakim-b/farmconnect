import { useAuth, useClerk } from '@clerk/expo';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import * as AuthSession from 'expo-auth-session';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { FarmConnectMark } from '@/components/logo';
import { RoleOptionCard } from '@/components/role-cards';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { setPendingRole } from '@/lib/pending-role';
import type { UserRole } from '@/lib/types';

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
  const [role, setRole] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAuth = async (mode: AuthMode) => {
    if (!role || busy) return;
    setBusy(true);
    // Remembered so role-select can apply it silently after auth returns.
    await setPendingRole(role);

    if (Platform.OS === 'web') {
      if (mode === 'sign-up') await clerk.redirectToSignUp();
      else await clerk.redirectToSignIn();
      return;
    }

    try {
      await startHostedAuth({ mode, redirectUrl: HOSTED_AUTH_REDIRECT_URL });
    } finally {
      setBusy(false);
    }
  };

  if (isLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <FarmConnectMark size={76} />
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

      {!role ? (
        <View style={styles.step}>
          <ThemedText type="smallBold">First, who are you?</ThemedText>
          <RoleOptionCard role="customer" onPress={setRole} />
          <RoleOptionCard role="vendor" onPress={setRole} />
        </View>
      ) : (
        <ThemedView type="backgroundElement" style={styles.panel}>
          <View style={styles.panelHead}>
            <ThemedText type="smallBold">
              Joining as {role === 'vendor' ? 'a farmer' : 'a customer'}
            </ThemedText>
            <Pressable onPress={() => setRole(null)} disabled={busy} hitSlop={8}>
              <ThemedText type="linkPrimary">Change</ThemedText>
            </Pressable>
          </View>
          <Button isDisabled={busy} onPress={() => handleAuth('sign-up')}>
            Create an account
          </Button>
          <Button isDisabled={busy} variant="secondary" onPress={() => handleAuth('sign-in')}>
            Sign in
          </Button>
        </ThemedView>
      )}
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
  step: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    marginBottom: Spacing.four,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

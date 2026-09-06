import { useAuth, useUser } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button } from 'heroui-native';

import { Wordmark } from '@/components/logo';
import { RoleOptionCard, ROLE_OPTIONS } from '@/components/role-cards';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { toError } from '@/lib/errors';
import { clearPendingRole, peekPendingRole } from '@/lib/pending-role';
import type { UserRole } from '@/lib/types';

export default function RoleSelectScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { profile, loading, saveRole } = useProfile();
  const router = useRouter();
  const theme = useTheme();

  const [saving, setSaving] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  // While we check for a role picked on the welcome screen.
  const [checking, setChecking] = useState(true);
  // When set, we still need a display name before we can finish this role.
  const [nameFor, setNameFor] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const handled = useRef(false);

  // Clerk hosted sign-up with email + password gives us no name, so customers
  // enter one here — it becomes their account name everywhere (farmers see it
  // on bookings and reviews).
  const clerkName = user?.fullName ?? user?.firstName ?? null;

  const apply = async (role: UserRole, displayName?: string) => {
    setSaving(role);
    setError(null);
    try {
      await saveRole(role, displayName);
      await clearPendingRole();
      router.replace(role === 'vendor' ? '/(vendor)' : '/(customer)');
    } catch (err) {
      setError(toError(err).message || 'Could not save your choice. Please try again.');
      setSaving(null);
      setChecking(false); // fall back to the manual picker
    }
  };

  // A tapped role card, or a role picked on the welcome screen: customers with
  // no Clerk name stop to enter one; everyone else proceeds straight through.
  const choose = (role: UserRole) => {
    if (role === 'customer' && !clerkName) {
      setNameFor('customer');
      setChecking(false);
      return;
    }
    void apply(role);
  };

  useEffect(() => {
    if (handled.current) return;
    // Wait until Clerk has fully loaded the signed-in user, and the shared
    // profile fetch has settled. Applying a role before `user` exists throws.
    if (!authLoaded || !userLoaded || loading) return;
    if (!isSignedIn) {
      setChecking(false);
      return;
    }
    if (profile) {
      setChecking(false);
      return;
    }
    if (!user) return; // signed in but user resource not ready yet — keep waiting

    handled.current = true;
    (async () => {
      const pending = await peekPendingRole();
      if (pending) {
        choose(pending);
      } else {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, userLoaded, loading, isSignedIn, profile, user]);

  if (!authLoaded || !userLoaded || loading || checking) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (profile && !saving) {
    return <Redirect href={profile.role === 'vendor' ? '/(vendor)' : '/(customer)'} />;
  }

  if (nameFor) {
    const trimmed = name.trim();
    return (
      <Screen scroll={false}>
        <View style={styles.hero}>
          <Wordmark markSize={26} style={styles.brand} />
          <ThemedText type="title">What&rsquo;s your name?</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.lede}>
            This is how farmers will see you on bookings and reviews.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
            onSubmitEditing={() => trimmed && apply(nameFor, trimmed)}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          />
          <Button
            isDisabled={!trimmed || saving !== null}
            onPress={() => apply(nameFor, trimmed)}>
            {saving ? 'Setting up…' : 'Continue'}
          </Button>
          <Pressable
            onPress={() => {
              setNameFor(null);
              setName('');
            }}
            disabled={saving !== null}
            hitSlop={8}
            style={styles.change}>
            <ThemedText type="linkPrimary">Choose a different role</ThemedText>
          </Pressable>
        </View>

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
      </Screen>
    );
  }

  const firstName = user?.firstName;

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <Wordmark markSize={26} style={styles.brand} />
        <ThemedText type="title">
          {firstName ? `Welcome, ${firstName}` : 'Welcome to FarmConnect'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lede}>
          How will you use FarmConnect? You can change this later from your account.
        </ThemedText>
      </View>

      <View style={styles.cards}>
        {ROLE_OPTIONS.map((opt) => (
          <RoleOptionCard
            key={opt.role}
            role={opt.role}
            onPress={choose}
            busy={saving === opt.role}
            disabled={saving !== null}
          />
        ))}
      </View>

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    paddingTop: Spacing.six,
    marginBottom: Spacing.four,
  },
  brand: {
    marginBottom: Spacing.two,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
  },
  cards: {
    gap: Spacing.three,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
    minHeight: 52,
  },
  change: {
    alignSelf: 'flex-start',
  },
  error: {
    color: '#B42318',
    marginTop: Spacing.three,
  },
});

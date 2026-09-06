import { useAuth, useUser } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoleOptionCard, ROLE_OPTIONS } from '@/components/role-cards';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { clearPendingRole, peekPendingRole } from '@/lib/pending-role';
import type { UserRole } from '@/lib/types';

export default function RoleSelectScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile, loading, saveRole } = useProfile();
  const router = useRouter();

  const [saving, setSaving] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  // While we check for a role picked on the welcome screen.
  const [checking, setChecking] = useState(true);
  const handled = useRef(false);

  const apply = async (role: UserRole) => {
    setSaving(role);
    setError(null);
    try {
      await saveRole(role);
      await clearPendingRole();
      router.replace(role === 'vendor' ? '/(vendor)' : '/(customer)');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not save your choice. Check the Supabase and Clerk setup.',
      );
      setSaving(null);
      setChecking(false); // fall back to the manual picker
    }
  };

  useEffect(() => {
    if (handled.current) return;
    if (!isLoaded || loading) return;
    if (!isSignedIn || profile) {
      setChecking(false);
      return;
    }
    handled.current = true;
    (async () => {
      const pending = await peekPendingRole();
      if (pending) {
        await apply(pending);
      } else {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, loading, isSignedIn, profile]);

  if (!isLoaded || loading || checking) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (profile && !saving) {
    return <Redirect href={profile.role === 'vendor' ? '/(vendor)' : '/(customer)'} />;
  }

  const firstName = user?.firstName;

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
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
            onPress={apply}
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
  lede: {
    fontSize: 16,
    lineHeight: 24,
  },
  cards: {
    gap: Spacing.three,
  },
  error: {
    color: '#B42318',
    marginTop: Spacing.three,
  },
});

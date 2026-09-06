import { useAuth, useUser } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/hooks/use-profile';
import type { UserRole } from '@/lib/types';

const OPTIONS: {
  role: UserRole;
  title: string;
  blurb: string;
  icon: Parameters<typeof SymbolView>[0]['name'];
}[] = [
  {
    role: 'customer',
    title: "I'm a customer",
    blurb: 'Buy produce and meats, book a slaughter, and find farm activities near me.',
    icon: 'basket.fill',
  },
  {
    role: 'vendor',
    title: "I'm a farmer",
    blurb: 'List my farm, manage what I sell, and take bookings from customers.',
    icon: 'leaf.fill',
  },
];

export default function RoleSelectScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile, loading, saveRole } = useProfile();
  const router = useRouter();
  const theme = useTheme();
  const [saving, setSaving] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (profile && !saving) {
    return <Redirect href={profile.role === 'vendor' ? '/(vendor)' : '/(customer)'} />;
  }

  const firstName = user?.firstName;

  async function choose(role: UserRole) {
    setSaving(role);
    setError(null);
    try {
      await saveRole(role);
      router.replace(role === 'vendor' ? '/(vendor)' : '/(customer)');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not save your choice. Check the Supabase and Clerk setup.',
      );
      setSaving(null);
    }
  }

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
        {OPTIONS.map((opt) => {
          const isSaving = saving === opt.role;
          const disabled = saving !== null;
          return (
            <Pressable
              key={opt.role}
              onPress={() => choose(opt.role)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: isSaving ? theme.primary : theme.border,
                  opacity: disabled && !isSaving ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
                {isSaving ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <SymbolView name={opt.icon} size={28} tintColor={theme.primary} />
                )}
              </View>
              <View style={styles.cardText}>
                <ThemedText type="heading">{opt.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {opt.blurb}
                </ThemedText>
              </View>
              <SymbolView name="chevron.right" size={16} tintColor={theme.textSecondary} />
            </Pressable>
          );
        })}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    minHeight: 92,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: Spacing.half,
  },
  error: {
    color: '#B42318',
    marginTop: Spacing.three,
  },
});

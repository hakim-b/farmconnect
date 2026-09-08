import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { Wordmark } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { identityFromUser } from '@/lib/auth';
import type { Profile } from '@/lib/types';

export function AccountHeader({
  title,
  subtitle,
  profile,
  right,
}: {
  title: string;
  subtitle?: string;
  profile: Profile | null;
  /** Replaces the default "Sign out" button (e.g. the customer profile button). */
  right?: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const name = profile?.display_name ?? identityFromUser(user).first ?? 'there';

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Wordmark markSize={22} />
        {right ?? (
          <Button size="sm" variant="secondary" onPress={() => signOut()}>
            Sign out
          </Button>
        )}
      </View>
      <View style={styles.copy}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle ?? `Welcome back, ${name}`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  copy: {
    gap: 4,
  },
});

import { useAuth, useUser } from '@clerk/expo';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { Wordmark } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Profile } from '@/lib/types';

export function AccountHeader({
  title,
  subtitle,
  profile,
}: {
  title: string;
  subtitle?: string;
  profile: Profile | null;
}) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const name = profile?.display_name ?? user?.firstName ?? 'there';

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Wordmark markSize={22} />
        <Button size="sm" variant="secondary" onPress={() => signOut()}>
          Sign out
        </Button>
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

import { useAuth, useUser } from '@clerk/expo';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

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
    <View style={styles.row}>
      <View style={styles.copy}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle ?? `Welcome back, ${name}`}
        </ThemedText>
      </View>
      <Button size="sm" variant="secondary" onPress={() => signOut()}>
        Sign out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});

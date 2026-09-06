import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/lib/types';

export const ROLE_OPTIONS: {
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

export function RoleOptionCard({
  role,
  onPress,
  busy = false,
  disabled = false,
}: {
  role: UserRole;
  onPress: (role: UserRole) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const opt = ROLE_OPTIONS.find((o) => o.role === role)!;

  return (
    <Pressable
      onPress={() => onPress(role)}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: busy ? theme.primary : theme.border,
          opacity: disabled && !busy ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
        {busy ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <SymbolView name={opt.icon} size={28} tintColor={theme.primary} />
        )}
      </View>
      <View style={styles.text}>
        <ThemedText type="heading">{opt.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {opt.blurb}
        </ThemedText>
      </View>
      <SymbolView name="chevron.right" size={16} tintColor={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});

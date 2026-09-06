import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/lib/types';

export const ROLE_OPTIONS: {
  role: UserRole;
  title: string;
  blurb: string;
}[] = [
  {
    role: 'customer',
    title: "I'm a customer",
    blurb: 'Buy produce and meats, book a slaughter, and find farm activities near me.',
  },
  {
    role: 'vendor',
    title: "I'm a farmer",
    blurb: 'List my farm, manage what I sell, and take bookings from customers.',
  },
];

function RoleIcon({ role, color }: { role: UserRole; color: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      {role === 'customer' ? (
        <>
          <Path d="M5 10h20l-2 14H7L5 10Z" fill={color} />
          <Path d="M10 10a5 5 0 0 1 10 0" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M11 14v6M15 14v6M19 14v6" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path d="M24 5C14 5 7 10 7 19c0 2 1 4 2 6 2-7 6-12 13-15" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8 24c5-1 10-4 14-9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

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
          <RoleIcon role={role} color={theme.primary} />
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

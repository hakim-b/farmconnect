import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeVariant = 'halal' | 'sale' | 'neutral' | 'outline';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const theme = useTheme();

  const palette: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
    halal: { bg: theme.primary, fg: theme.onPrimary },
    sale: { bg: theme.accent, fg: theme.onAccent },
    neutral: { bg: theme.backgroundSelected, fg: theme.textSecondary },
    outline: { bg: 'transparent', fg: theme.textSecondary, border: theme.border },
  };
  const c = palette[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        c.border ? { borderWidth: 1, borderColor: c.border } : null,
        style,
      ]}>
      <ThemedText style={[styles.text, { color: c.fg }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});

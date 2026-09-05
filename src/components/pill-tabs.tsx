import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PillTabsProps<T extends string> = {
  tabs: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

/** Sticky segmented tab bar — DESIGN.md §2.4. */
export function PillTabs<T extends string>({ tabs, value, onChange }: PillTabsProps<T>) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[
                styles.tab,
                active && { backgroundColor: theme.surface },
              ]}>
              <ThemedText
                type="smallBold"
                themeColor={active ? 'primary' : 'textSecondary'}
                numberOfLines={1}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
});

import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LocationHeaderProps = {
  location: string;
  onPress?: () => void;
};

/** "Searching near: Montreal" selector — DESIGN.md §2.2 header. */
export function LocationHeader({ location, onPress }: LocationHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Searching near
      </ThemedText>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
        <SymbolView name="mappin.and.ellipse" size={18} tintColor={theme.primary} />
        <ThemedText type="subtitle">{location}</ThemedText>
        <SymbolView name="chevron.down" size={14} tintColor={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

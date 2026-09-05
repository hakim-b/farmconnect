import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RatingProps = {
  rating: number;
  reviewCount?: number;
  travelMin?: number;
};

/** Golden-ochre star rating row — DESIGN.md §2.2 "Stats Row". */
export function Rating({ rating, reviewCount, travelMin }: RatingProps) {
  const theme = useTheme();

  const parts: string[] = [rating.toFixed(1)];
  if (reviewCount != null) {
    parts.push(reviewCount >= 100 ? `(${Math.floor(reviewCount / 100) * 100}+)` : `(${reviewCount})`);
  }

  return (
    <View style={styles.row}>
      <SymbolView name="star.fill" size={12} tintColor={theme.ochre} />
      <ThemedText type="small" themeColor="textSecondary">
        {parts.join(' ')}
        {travelMin != null ? `  •  ${travelMin} min` : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});

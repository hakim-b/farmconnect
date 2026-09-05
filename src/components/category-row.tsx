import { type ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type CategoryRowProps<T> = {
  title: string;
  subtitle?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
};

/** A horizontally-scrolling category — DESIGN.md §2.2 (Uber Eats style feed). */
export function CategoryRow<T>({
  title,
  subtitle,
  data,
  keyExtractor,
  renderItem,
}: CategoryRowProps<T>) {
  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="heading">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderItem(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.three }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  header: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.half,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
  },
});

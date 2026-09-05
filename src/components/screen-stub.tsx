import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenStubProps = {
  title: string;
  symbol: SymbolViewProps['name'];
  blurb: string;
};

/** Placeholder for screens outside this build's scope (see DESIGN.md). */
export function ScreenStub({ title, symbol, blurb }: ScreenStubProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.four }]}>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView name={symbol} size={40} tintColor={theme.primary} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.blurb}>
          {blurb}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  title: {
    marginBottom: Spacing.four,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurb: {
    textAlign: 'center',
    maxWidth: 280,
  },
});

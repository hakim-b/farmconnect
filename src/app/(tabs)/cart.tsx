import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart, type CartLine } from '@/lib/cart';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { lines, subtotal, count, setQty, clear } = useCart();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}>
        <ThemedText type="title" style={styles.title}>
          Cart
        </ThemedText>

        {lines.length === 0 ? (
          <View style={styles.empty}>
            <SymbolView name="basket" size={40} tintColor={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Your basket is empty. Add items from a farm.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {lines.map((line) => (
              <CartRow key={line.product.id} line={line} onQty={setQty} />
            ))}
          </View>
        )}
      </ScrollView>

      {lines.length > 0 && (
        <ThemedView
          type="surface"
          style={[
            styles.footer,
            { borderColor: theme.border, paddingBottom: insets.bottom + BottomTabInset + Spacing.two },
          ]}>
          <View style={styles.subtotalRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Subtotal · {count} item{count === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText type="heading">${subtotal.toFixed(2)}</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Alert.alert('Checkout', 'Checkout flow is not built yet.', [
                { text: 'OK' },
                { text: 'Clear cart', style: 'destructive', onPress: clear },
              ]);
            }}
            style={({ pressed }) => [
              styles.checkout,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Checkout
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </ThemedView>
  );
}

function CartRow({
  line,
  onQty,
}: {
  line: CartLine;
  onQty: (id: string, qty: number) => void;
}) {
  const theme = useTheme();
  const { product, qty } = line;

  return (
    <ThemedView type="surface" style={[styles.row, { borderColor: theme.border }]}>
      <Image source={product.image} style={styles.thumb} contentFit="cover" />
      <View style={styles.rowBody}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ${product.price.toFixed(2)} / {product.unit}
        </ThemedText>
        <View style={styles.stepper}>
          <Stepper
            icon="minus"
            onPress={() => onQty(product.id, qty - 1)}
            color={theme.text}
            bg={theme.backgroundSelected}
          />
          <ThemedText type="smallBold" style={styles.qty}>
            {qty}
          </ThemedText>
          <Stepper
            icon="plus"
            onPress={() => onQty(product.id, qty + 1)}
            color={theme.onPrimary}
            bg={theme.primary}
          />
        </View>
      </View>
      <ThemedText type="smallBold">${(qty * product.price).toFixed(2)}</ThemedText>
    </ThemedView>
  );
}

function Stepper({
  icon,
  onPress,
  color,
  bg,
}: {
  icon: 'plus' | 'minus';
  onPress: () => void;
  color: string;
  bg: string;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={[styles.stepBtn, { backgroundColor: bg }]}>
      <SymbolView name={icon} size={12} tintColor={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  title: { marginBottom: Spacing.four },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  list: { gap: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  rowBody: { flex: 1, gap: Spacing.half },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 16, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkout: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});

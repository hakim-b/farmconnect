import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Wordmark } from '@/components/logo';
import { EmptyState, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stepper } from '@/components/vendor-ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart';
import { productPhoto } from '@/lib/photos';
import { formatPrice } from '@/lib/types';

export default function CartScreen() {
  const theme = useTheme();
  const { lines, count, subtotal, setQty, remove, clear } = useCart();

  const priceOf = (p: (typeof lines)[number]['product']) =>
    p.is_on_sale && p.sale_price != null ? p.sale_price : p.price;

  return (
    <Screen>
      <Wordmark markSize={22} style={styles.brand} />
      <ThemedText type="subtitle">Your cart</ThemedText>

      {lines.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          body="Tap an item on the Home tab or a farm page to add it here."
        />
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {count} {count === 1 ? 'item' : 'items'} · demo only — there is no checkout.
          </ThemedText>

          {lines.map(({ product, qty }) => (
            <ThemedView key={product.id} type="backgroundElement" style={styles.row}>
              <Image
                source={{ uri: productPhoto(product) }}
                style={styles.image}
                contentFit="cover"
              />
              <View style={styles.info}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {product.name}
                </ThemedText>
                {product.farms?.name ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {product.farms.name}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  {formatPrice(priceOf(product), product.pricing_type, product.unit)}
                </ThemedText>
                <View style={styles.qtyRow}>
                  <Stepper value={qty} onChange={(n) => setQty(product.id, n)} min={0} max={99} />
                  <Pressable onPress={() => remove(product.id)} hitSlop={8} style={styles.trash}>
                    <SymbolView name="trash" size={18} tintColor={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
              <ThemedText type="smallBold">
                ${(priceOf(product) * qty).toFixed(2)}
              </ThemedText>
            </ThemedView>
          ))}

          <ThemedView type="backgroundElement" style={styles.totalCard}>
            <View style={styles.totalRow}>
              <ThemedText type="heading">Subtotal</ThemedText>
              <ThemedText type="heading">${subtotal.toFixed(2)}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Proof of concept — the farmer would confirm your order and payment in person.
            </ThemedText>
            <Pressable
              onPress={() =>
                Alert.alert('Clear cart', 'Remove everything from your cart?', [
                  { text: 'Keep it', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clear },
                ])
              }
              style={[styles.clearBtn, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Clear cart
              </ThemedText>
            </Pressable>
          </ThemedView>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: '#D6D3D1',
  },
  info: { flex: 1, gap: 3 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  trash: { padding: Spacing.one },
  totalCard: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
});

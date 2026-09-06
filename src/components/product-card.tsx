import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart';
import { productPhoto } from '@/lib/photos';
import { formatPrice, type Product } from '@/lib/types';

export function ProductCard({
  product,
  compact = false,
  onPress,
}: {
  product: Product;
  compact?: boolean;
  onPress?: (product: Product) => void;
}) {
  const theme = useTheme();
  const cart = useCart();
  const inCart = cart.qtyOf(product.id);
  const price = product.is_on_sale && product.sale_price != null ? product.sale_price : product.price;

  return (
    <Pressable
      onPress={onPress ? () => onPress(product) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null, compact && styles.compact]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View>
          <Image
            source={{ uri: productPhoto(product) }}
            style={[styles.image, compact && styles.compactImage, { backgroundColor: theme.backgroundSelected }]}
            contentFit="cover"
            transition={150}
          />
          {inCart > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <ThemedText type="small" style={styles.badgeText}>
                {inCart} in cart
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {product.is_on_sale ? (
            <ThemedText type="small" style={styles.sale}>
              On sale
            </ThemedText>
          ) : null}
          <ThemedText type="smallBold" numberOfLines={2}>
            {product.name}
          </ThemedText>
          {product.farms?.name ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {product.farms.name}
            </ThemedText>
          ) : null}

          <View style={styles.priceRow}>
            <ThemedText type="smallBold" style={styles.price}>
              {formatPrice(price, product.pricing_type, product.unit)}
            </ThemedText>
            {onPress ? (
              <View style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                <SymbolView name="plus" size={14} tintColor={theme.onPrimary} />
              </View>
            ) : null}
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  card: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    flex: 1,
  },
  compact: {
    width: 200,
    flex: 0,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#D6D3D1',
  },
  compactImage: {
    height: 110,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  body: {
    padding: Spacing.two,
    gap: 4,
  },
  sale: {
    color: '#2F6B3A',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {},
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatPrice, type Product } from '@/lib/types';

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const price = product.is_on_sale && product.sale_price != null ? product.sale_price : product.price;

  return (
    <ThemedView type="backgroundElement" style={[styles.card, compact && styles.compact]}>
      <Image
        source={{ uri: product.image_url ?? undefined }}
        style={[styles.image, compact && styles.compactImage]}
        contentFit="cover"
      />
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
        <ThemedText type="smallBold" style={styles.price}>
          {formatPrice(price, product.pricing_type, product.unit)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
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
  body: {
    padding: Spacing.two,
    gap: 4,
  },
  sale: {
    color: '#2F6B3A',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  price: {
    marginTop: 2,
  },
});

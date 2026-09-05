import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Product } from '@/data/farms';

type ProductCardProps = {
  product: Product;
  onAdd?: (product: Product) => void;
  onPress?: (product: Product) => void;
  width?: number;
  block?: boolean;
};

export function ProductCard({
  product,
  onAdd,
  onPress,
  width = 160,
  block = false,
}: ProductCardProps) {
  const theme = useTheme();
  const disabled = !product.inStock;

  return (
    <ThemedView
      type="surface"
      style={[
        styles.card,
        { borderColor: theme.border },
        block ? styles.block : { width },
        disabled && styles.disabled,
      ]}>
      <Pressable onPress={() => onPress?.(product)} disabled={!onPress}>
        <Image source={product.image} style={styles.image} contentFit="cover" transition={150} />
        {product.onSale && (
          <View style={styles.badge}>
            <Badge label="Sale" variant="sale" />
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.name}>
          {product.name}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText type="smallBold" themeColor="primary">
            ${product.price.toFixed(2)}
            <ThemedText type="small" themeColor="textSecondary">
              {' '}
              / {product.unit}
            </ThemedText>
          </ThemedText>

          <Pressable
            disabled={disabled}
            hitSlop={8}
            onPress={() => onAdd?.(product)}
            style={[
              styles.addButton,
              { backgroundColor: disabled ? theme.backgroundSelected : theme.primary },
            ]}>
            <SymbolView
              name="plus"
              size={14}
              tintColor={disabled ? theme.textSecondary : theme.onPrimary}
            />
          </Pressable>
        </View>

        {disabled && (
          <ThemedText type="small" themeColor="textSecondary">
            Out of stock
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  block: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
  },
  body: {
    padding: Spacing.two,
    gap: Spacing.one,
  },
  name: {
    minHeight: 40,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

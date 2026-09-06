import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stepper } from '@/components/vendor-ui';
import { Radius, Spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { formatPrice, type Product } from '@/lib/types';

/**
 * Slide-up "how many do you want?" sheet. Mount with a `key={product.id}` so
 * it resets each time a different item opens it.
 */
export function AddToCartSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const cart = useCart();
  const inCart = product ? cart.qtyOf(product.id) : 0;
  const [qty, setQty] = useState(inCart > 0 ? inCart : 1);

  if (!product) return null;

  const unitPrice =
    product.is_on_sale && product.sale_price != null ? product.sale_price : product.price;
  const total = unitPrice * qty;

  const confirm = () => {
    if (inCart > 0) cart.setQty(product.id, qty);
    else cart.addQty(product, qty);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView type="surface" style={styles.sheet}>
          <View style={styles.handle} />

          <Image
            source={{ uri: product.image_url ?? undefined }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />

          <ThemedText type="heading">{product.name}</ThemedText>
          {product.farms?.name ? (
            <ThemedText type="small" themeColor="textSecondary">
              {product.farms.name}
            </ThemedText>
          ) : null}
          <ThemedText type="smallBold" themeColor="primary">
            {formatPrice(unitPrice, product.pricing_type, product.unit)}
          </ThemedText>

          <View style={styles.qtyBlock}>
            <ThemedText type="smallBold">How many?</ThemedText>
            <Stepper value={qty} onChange={setQty} min={1} max={99} />
          </View>

          <Button size="lg" onPress={confirm}>
            {inCart > 0
              ? `Update cart — $${total.toFixed(2)}`
              : `Add to cart — $${total.toFixed(2)}`}
          </Button>
          {inCart > 0 ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              onPress={onClose}
              style={styles.link}>
              {inCart} already in your cart
            </ThemedText>
          ) : null}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: Spacing.two,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.one,
  },
  qtyBlock: {
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  link: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: Spacing.one,
  },
});

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Rating } from '@/components/rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Farm } from '@/data/farms';
import { formatKm } from '@/lib/location';

type FarmCardProps = {
  farm: Farm;
  distanceKm: number;
  width?: number;
  /** Full-width variant for vertical lists (Map preview, search). */
  block?: boolean;
};

export function FarmCard({ farm, distanceKm, width = 280, block = false }: FarmCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [favorite, setFavorite] = useState(false);

  const deliveryText = farm.deliveryFee != null ? `$${farm.deliveryFee} delivery` : 'Pickup only';
  const hasSale = farm.products.some((p) => p.onSale);

  return (
    <ThemedView
      type="surface"
      style={[styles.card, { borderColor: theme.border }, block ? styles.block : { width }]}>
      <Pressable
        onPress={() => router.push(`/farm/${farm.id}`)}
        style={({ pressed }) => pressed && styles.pressed}>
        <View>
          <Image source={farm.image} style={styles.image} contentFit="cover" transition={200} />
          <View style={styles.overlayTags}>
            {farm.halalCertified && <Badge label="Halal certified" variant="halal" />}
            {hasSale && <Badge label="Sale" variant="sale" />}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <ThemedText type="heading" numberOfLines={1} style={styles.name}>
              {farm.name}
            </ThemedText>
            <Pressable hitSlop={10} onPress={() => setFavorite((v) => !v)}>
              <SymbolView
                name={favorite ? 'heart.fill' : 'heart'}
                size={20}
                tintColor={favorite ? theme.accent : theme.textSecondary}
              />
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {deliveryText}  •  {formatKm(distanceKm)} away
          </ThemedText>

          <Rating rating={farm.rating} reviewCount={farm.reviewCount} travelMin={farm.travelMin} />
        </View>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  block: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  overlayTags: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.one,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
});

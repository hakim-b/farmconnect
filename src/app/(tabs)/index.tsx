import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { FarmCard } from '@/components/farm-card';
import { LocationHeader } from '@/components/location-header';
import { ProductCard } from '@/components/product-card';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ALL_PRODUCTS, FARMS, getFarm } from '@/data/farms';
import { useCart } from '@/lib/cart';
import { distanceKm, USER_LOCATION } from '@/lib/location';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cart = useCart();

  const withDistance = useMemo(
    () =>
      FARMS.map((farm) => ({ farm, km: distanceKm(USER_LOCATION, farm) })).sort(
        (a, b) => a.km - b.km,
      ),
    [],
  );

  const slaughter = useMemo(
    () =>
      withDistance.filter(({ farm }) =>
        farm.services.some(
          (s) => s === 'on-site-slaughter' || s === 'zabiha-on-request',
        ),
      ),
    [withDistance],
  );

  const products = useMemo(
    () => [...ALL_PRODUCTS].sort((a, b) => Number(b.inStock) - Number(a.inStock)),
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}>
        <LocationHeader location="Montreal" />

        <View style={styles.sections}>
          <CategoryRow
            title="Farms near you"
            subtitle="Sorted by distance"
            data={withDistance}
            keyExtractor={({ farm }) => farm.id}
            renderItem={({ farm, km }) => <FarmCard farm={farm} distanceKm={km} />}
          />

          <CategoryRow
            title="Slaughter & Zabiha"
            subtitle="On-site or by request"
            data={slaughter}
            keyExtractor={({ farm }) => farm.id}
            renderItem={({ farm, km }) => <FarmCard farm={farm} distanceKm={km} />}
          />

          <CategoryRow
            title="Fresh produce & meats"
            subtitle="Add to your basket"
            data={products}
            keyExtractor={(p) => p.id}
            renderItem={(product) => (
              <ProductCard
                product={product}
                onAdd={cart.add}
                onPress={(p) => router.push(`/farm/${getFarm(p.farmId)?.id ?? p.farmId}`)}
              />
            )}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  sections: {
    gap: Spacing.five,
  },
});

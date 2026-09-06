import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AccountHeader } from '@/components/account-header';
import { AddToCartSheet } from '@/components/add-to-cart-sheet';
import { CustomerProfileButton } from '@/components/customer-profile-drawer';
import { FarmCard } from '@/components/farm-card';
import { ProductCard } from '@/components/product-card';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { usePublicSupabase } from '@/hooks/use-supabase';
import type { Farm, Product } from '@/lib/types';

export default function CustomerHomeScreen() {
  const { profile } = useProfile();
  const supabase = usePublicSupabase();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sales, setSales] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: farmRows, error: farmError }, { data: saleRows, error: saleError }] =
      await Promise.all([
        supabase
          .from('farms')
          .select('*, farm_certifications(*)')
          .eq('is_published', true)
          .order('average_rating', { ascending: false }),
        supabase
          .from('products')
          .select('*, farms(id, name, slug, thumbnail_url)')
          .eq('is_on_sale', true)
          .eq('is_available', true)
          .order('name'),
      ]);

    if (farmError || saleError) {
      setError(farmError?.message ?? saleError?.message ?? 'Could not load farms.');
    } else {
      setError(null);
      setFarms((farmRows as Farm[]) ?? []);
      setSales((saleRows as Product[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <Screen>
      <AccountHeader
        title="What's nearby"
        profile={profile}
        right={<CustomerProfileButton />}
      />

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.section}>
        <ThemedText type="smallBold">What's new</ThemedText>
        {sales.length === 0 ? (
          <EmptyState title="No sales yet" body="Nearby farms have not posted sale items." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {sales.map((product) => (
              <ProductCard key={product.id} product={product} compact onPress={setSheetProduct} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Local farms</ThemedText>
        {farms.length === 0 ? (
          <EmptyState title="No farms yet" body="Published farms will appear here." />
        ) : (
          farms.map((farm) => <FarmCard key={farm.id} farm={farm} />)
        )}
      </View>

      <AddToCartSheet
        key={sheetProduct?.id ?? 'none'}
        product={sheetProduct}
        onClose={() => setSheetProduct(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  carousel: {
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  error: {
    color: '#B42318',
  },
});

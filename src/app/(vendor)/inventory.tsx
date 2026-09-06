import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AccountHeader } from '@/components/account-header';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { AddButton, BigRow, TogglePill } from '@/components/vendor-ui';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { formatPrice, type Activity, type Product, type SlaughterOffering } from '@/lib/types';
import { itemKindsForFarm, money } from '@/lib/vendor-items';

type Table = 'products' | 'slaughter_offerings' | 'activities';

export default function VendorInventoryScreen() {
  const router = useRouter();
  const { farm, loading, profile, supabase } = useVendorFarm();
  const [products, setProducts] = useState<Product[]>([]);
  const [offerings, setOfferings] = useState<SlaughterOffering[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [busy, setBusy] = useState(false);

  const farmId = farm?.id;

  const load = useCallback(async () => {
    if (!farmId) return;
    const [p, o, a] = await Promise.all([
      supabase.from('products').select('*').eq('farm_id', farmId).order('name'),
      supabase.from('slaughter_offerings').select('*').eq('farm_id', farmId).order('name'),
      supabase.from('activities').select('*').eq('farm_id', farmId).order('name'),
    ]);
    setProducts((p.data as Product[]) ?? []);
    setOfferings((o.data as SlaughterOffering[]) ?? []);
    setActivities((a.data as Activity[]) ?? []);
  }, [farmId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) return null;

  const kinds = itemKindsForFarm(farm.farm_type);

  const toggle = async (table: Table, id: number, next: boolean) => {
    setBusy(true);
    const { error } = await supabase.from(table).update({ is_available: next }).eq('id', id);
    if (error) Alert.alert('Could not update', error.message);
    await load();
    setBusy(false);
  };

  const produce = products.filter((p) => p.category === 'produce');
  const meat = products.filter((p) => p.category === 'meat');
  const nothingYet = products.length === 0 && offerings.length === 0 && activities.length === 0;

  return (
    <Screen>
      <AccountHeader title="My items" profile={profile} />

      <AddButton label="Add an item" onPress={() => router.push('/vendor-item')} />

      {nothingYet ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          You haven&apos;t added anything yet. Tap the green button to add your first item —
          {kinds.includes('produce') ? ' produce,' : ''} meat
          {kinds.includes('animal') ? ', animals for slaughter,' : ''} or farm activities.
        </ThemedText>
      ) : null}

      {produce.length > 0 ? (
        <Section title="Produce">
          {produce.map((p) => (
            <BigRow
              key={p.id}
              title={p.name}
              subtitle={`${formatPrice(
                p.is_on_sale && p.sale_price != null ? p.sale_price : p.price,
                p.pricing_type,
                p.unit,
              )}${p.stock_quantity != null ? ` · ${p.stock_quantity} left` : ''}`}
              onPress={() => router.push(`/vendor-item?id=${p.id}&kind=produce`)}
              right={
                <TogglePill
                  on={p.is_available}
                  onLabel="For sale"
                  offLabel="Hidden"
                  onToggle={() => !busy && toggle('products', p.id, !p.is_available)}
                />
              }
            />
          ))}
        </Section>
      ) : null}

      {meat.length > 0 ? (
        <Section title="Meat">
          {meat.map((p) => (
            <BigRow
              key={p.id}
              title={p.name}
              subtitle={`${formatPrice(
                p.is_on_sale && p.sale_price != null ? p.sale_price : p.price,
                p.pricing_type,
                p.unit,
              )}${p.stock_quantity != null ? ` · ${p.stock_quantity} kg left` : ''}`}
              onPress={() => router.push(`/vendor-item?id=${p.id}&kind=meat`)}
              right={
                <TogglePill
                  on={p.is_available}
                  onLabel="For sale"
                  offLabel="Hidden"
                  onToggle={() => !busy && toggle('products', p.id, !p.is_available)}
                />
              }
            />
          ))}
        </Section>
      ) : null}

      {offerings.length > 0 ? (
        <Section title="Animals for slaughter">
          {offerings.map((o) => (
            <BigRow
              key={o.id}
              title={o.name}
              subtitle={`${money(o.price)} · up to ${o.max_split_participants} families`}
              onPress={() => router.push(`/vendor-item?id=${o.id}&kind=animal`)}
              right={
                <TogglePill
                  on={o.is_available}
                  onLabel="Bookable"
                  offLabel="Hidden"
                  onToggle={() => !busy && toggle('slaughter_offerings', o.id, !o.is_available)}
                />
              }
            />
          ))}
        </Section>
      ) : null}

      {activities.length > 0 ? (
        <Section title="Farm activities">
          {activities.map((a) => (
            <BigRow
              key={a.id}
              title={a.name}
              subtitle={a.price === 0 ? 'Free' : money(a.price)}
              onPress={() => router.push(`/vendor-item?id=${a.id}&kind=activity`)}
              right={
                <TogglePill
                  on={a.is_available}
                  onLabel="Bookable"
                  offLabel="Hidden"
                  onToggle={() => !busy && toggle('activities', a.id, !a.is_available)}
                />
              }
            />
          ))}
        </Section>
      ) : null}

      {!nothingYet ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.tip}>
          Tap an item to change its price. Tap the pill on the right to show or hide it from
          customers.
        </ThemedText>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  empty: { lineHeight: 22 },
  tip: { marginTop: Spacing.two, lineHeight: 20 },
});

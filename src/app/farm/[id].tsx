import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Button, Tabs } from 'heroui-native';

import { AddToCartSheet } from '@/components/add-to-cart-sheet';
import { CertificationRow } from '@/components/farm-card';
import { ProductCard } from '@/components/product-card';
import { ReserveSlotSheet, type ReserveTarget } from '@/components/reserve-slot-sheet';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePublicSupabase } from '@/hooks/use-supabase';
import {
  FARM_TYPE_LABELS,
  formatPrice,
  formatRating,
  type Activity,
  type AvailabilitySlot,
  type Farm,
  type Product,
  type Review,
  type SlaughterOffering,
} from '@/lib/types';

function nextTimeLabel(slots: AvailabilitySlot[]): string {
  const open = slots.filter((s) => s.remaining > 0);
  if (open.length === 0) return slots.length > 0 ? 'All posted times are full' : 'No times posted yet';
  const next = open[0];
  const when = new Date(next.starts_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const spots = open.reduce((sum, s) => sum + s.remaining, 0);
  return `Next: ${when} · ${spots} ${spots === 1 ? 'spot' : 'spots'} open`;
}

export default function FarmProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmId = Number(id);
  const publicClient = usePublicSupabase();
  const [tab, setTab] = useState('produce');
  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offerings, setOfferings] = useState<SlaughterOffering[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [reserveTarget, setReserveTarget] = useState<ReserveTarget | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(farmId)) return;
    const [farmRes, productRes, offeringRes, activityRes, slotRes, reviewRes] = await Promise.all([
      publicClient.from('farms').select('*, farm_certifications(*)').eq('id', farmId).maybeSingle(),
      publicClient.from('products').select('*').eq('farm_id', farmId).eq('is_available', true),
      publicClient.from('slaughter_offerings').select('*').eq('farm_id', farmId).eq('is_available', true),
      publicClient.from('activities').select('*').eq('farm_id', farmId).eq('is_available', true),
      publicClient
        .from('availability_slots')
        .select('*')
        .eq('farm_id', farmId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at'),
      publicClient
        .from('reviews')
        .select('*, profiles(id, display_name)')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false }),
    ]);
    setFarm((farmRes.data as Farm | null) ?? null);
    setProducts((productRes.data as Product[]) ?? []);
    setOfferings((offeringRes.data as SlaughterOffering[]) ?? []);
    setActivities((activityRes.data as Activity[]) ?? []);
    setSlots((slotRes.data as AvailabilitySlot[]) ?? []);
    setReviews((reviewRes.data as Review[]) ?? []);
    setLoading(false);
  }, [farmId, publicClient]);

  // Refetch whenever the screen regains focus (e.g. coming back from Bookings).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Live updates: reflect new times / filled spots the moment a farmer changes
  // them, without the customer leaving the page. Silently inert if the project's
  // realtime publication doesn't include the table.
  useEffect(() => {
    if (!Number.isFinite(farmId)) return;
    const channel = publicClient
      .channel(`farm-slots-${farmId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability_slots', filter: `farm_id=eq.${farmId}` },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void publicClient.removeChannel(channel);
    };
  }, [farmId, publicClient, load]);

  if (loading) return <LoadingScreen />;
  if (!farm) {
    return (
      <Screen>
        <EmptyState title="Farm not found" body="This farm is unpublished or does not exist." />
      </Screen>
    );
  }

  const labels = (farm.farm_certifications ?? []).map((item) => item.label);
  const slaughterSlots = slots.filter((slot) => slot.slot_type === 'slaughter');
  const activitySlots = slots.filter((slot) => slot.slot_type === 'activity');

  return (
    <Screen>
      <Stack.Screen options={{ title: farm.name }} />
      <Image source={{ uri: farm.thumbnail_url ?? undefined }} style={styles.hero} contentFit="cover" />
      <ThemedText type="subtitle">{farm.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        ★ {formatRating(farm.average_rating)} ({farm.review_count}) · {FARM_TYPE_LABELS[farm.farm_type]}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {[farm.address_line, farm.city, farm.region].filter(Boolean).join(', ')}
      </ThemedText>
      <CertificationRow labels={labels} />
      {farm.description ? <ThemedText>{farm.description}</ThemedText> : null}
      {message ? (
        <ThemedText type="small" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Indicator />
          <Tabs.Trigger value="produce">
            <Tabs.Label>Produce & meats</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="slaughter">
            <Tabs.Label>Slaughter</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="activities">
            <Tabs.Label>Activities</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="produce">
          <View style={styles.grid}>
            {products.length === 0 ? (
              <EmptyState title="No items listed" body="This farm has not posted produce or meats." />
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={(p) =>
                    setSheetProduct({
                      ...p,
                      farms: {
                        id: farm.id,
                        name: farm.name,
                        slug: farm.slug,
                        thumbnail_url: farm.thumbnail_url,
                      },
                    })
                  }
                />
              ))
            )}
          </View>
        </Tabs.Content>

        <Tabs.Content value="slaughter">
          <ThemedText type="small" themeColor="textSecondary" style={styles.help}>
            Book a whole animal and optionally invite others by email to split the cost and yield.
          </ThemedText>
          {offerings.length === 0 && slaughterSlots.length === 0 ? (
            <EmptyState title="No slaughter dates" body="This farm is not offering slaughter bookings." />
          ) : (
            <>
              {offerings.map((offering) => (
                <ThemedView key={offering.id} type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">{offering.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {offering.description}
                  </ThemedText>
                  <ThemedText type="small">{formatPrice(offering.price)}</ThemedText>
                  {offering.max_split_participants > 1 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Split up to {offering.max_split_participants} ways ·{' '}
                      {formatPrice(offering.price / offering.max_split_participants)} each
                    </ThemedText>
                  ) : null}
                  {offering.yield_notes ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {offering.yield_notes}
                    </ThemedText>
                  ) : null}
                  <ThemedText type="small" themeColor="primary" style={styles.slotHint}>
                    {nextTimeLabel(slaughterSlots)}
                  </ThemedText>
                  <Button
                    size="sm"
                    onPress={() => setReserveTarget({ kind: 'slaughter', offering })}>
                    {slaughterSlots.some((s) => s.remaining > 0) ? 'Reserve a time' : 'Request a time'}
                  </Button>
                </ThemedView>
              ))}

              {offerings.length === 0 && slaughterSlots.length > 0 ? (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">Slaughter appointment</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Pick one of the farm&apos;s open times below. They&apos;ll confirm the animal and
                    price with you.
                  </ThemedText>
                  <ThemedText type="small" themeColor="primary" style={styles.slotHint}>
                    {nextTimeLabel(slaughterSlots)}
                  </ThemedText>
                  <Button
                    size="sm"
                    onPress={() => setReserveTarget({ kind: 'slaughter', offering: null })}>
                    {slaughterSlots.some((s) => s.remaining > 0) ? 'Reserve a time' : 'Request a time'}
                  </Button>
                </ThemedView>
              ) : null}
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="activities">
          {activities.length === 0 ? (
            <EmptyState title="No activities" body="This farm has not listed tours or experiences." />
          ) : (
            activities.map((activity) => (
              <ThemedView key={activity.id} type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">{activity.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {activity.description}
                </ThemedText>
                <ThemedText type="small">
                  {activity.price === 0 ? 'Free' : formatPrice(activity.price)}
                  {activity.duration_minutes ? ` · ${activity.duration_minutes} min` : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="primary" style={styles.slotHint}>
                  {nextTimeLabel(activitySlots)}
                </ThemedText>
                <Button
                  size="sm"
                  onPress={() => setReserveTarget({ kind: 'activity', activity })}>
                  {activitySlots.some((s) => s.remaining > 0) ? 'Reserve a time' : 'Request a time'}
                </Button>
              </ThemedView>
            ))
          )}
        </Tabs.Content>
      </Tabs>

      <AddToCartSheet
        key={sheetProduct?.id ?? 'none'}
        product={sheetProduct}
        onClose={() => setSheetProduct(null)}
      />

      <ReserveSlotSheet
        key={
          reserveTarget
            ? `reserve-${reserveTarget.kind}-${
                reserveTarget.kind === 'slaughter'
                  ? (reserveTarget.offering?.id ?? 'generic')
                  : reserveTarget.activity.id
              }`
            : 'reserve-none'
        }
        target={reserveTarget}
        farmId={farmId}
        farmName={farm.name}
        slots={slots}
        onClose={() => setReserveTarget(null)}
        onReserved={(m) => {
          setReserveTarget(null);
          setMessage(m);
          void load();
        }}
      />

      {reviews.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold">Reviews</ThemedText>
          {reviews.map((review) => (
            <ThemedView key={review.id} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">
                ★ {review.rating} · {review.profiles?.display_name ?? 'Customer'}
              </ThemedText>
              {review.comment ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {review.comment}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(review.created_at).toLocaleDateString()}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.three,
    backgroundColor: '#D6D3D1',
  },
  grid: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  help: {
    marginTop: Spacing.three,
  },
  slotHint: {
    marginTop: Spacing.one,
  },
  message: {
    color: '#2F6B3A',
  },
});

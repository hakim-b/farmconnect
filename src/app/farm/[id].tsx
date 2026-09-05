import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button, Tabs } from 'heroui-native';

import { CertificationRow } from '@/components/farm-card';
import { ProductCard } from '@/components/product-card';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/hooks/use-profile';
import { usePublicSupabase, useSupabase } from '@/hooks/use-supabase';
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

export default function FarmProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmId = Number(id);
  const theme = useTheme();
  const { profile } = useProfile();
  const publicClient = usePublicSupabase();
  const supabase = useSupabase();
  const [tab, setTab] = useState('produce');
  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offerings, setOfferings] = useState<SlaughterOffering[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitees, setInvitees] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

  async function bookSlaughter(offering: SlaughterOffering, slot?: AvailabilitySlot) {
    if (!profile) {
      setMessage('Sign in as a customer to book.');
      return;
    }
    const scheduledAt = slot?.starts_at ?? new Date(Date.now() + 86400000).toISOString();
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        farm_id: farmId,
        customer_profile_id: profile.id,
        booking_type: 'slaughter',
        slaughter_offering_id: offering.id,
        slot_id: slot?.id ?? null,
        scheduled_at: scheduledAt,
        total_price: offering.price,
        notes: invitees ? `Split with: ${invitees}` : null,
      })
      .select()
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    const emails = invitees
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (emails.length && data) {
      await supabase.from('booking_invitees').insert(
        emails.map((email) => ({
          booking_id: data.id,
          invitee_email: email,
        })),
      );
    }
    setInvitees('');
    setMessage(`Requested ${offering.name}. The farm will confirm the slot.`);
  }

  async function bookActivity(activity: Activity, slot?: AvailabilitySlot) {
    if (!profile) {
      setMessage('Sign in as a customer to book.');
      return;
    }
    const scheduledAt = slot?.starts_at ?? new Date(Date.now() + 86400000).toISOString();
    const { error } = await supabase.from('bookings').insert({
      farm_id: farmId,
      customer_profile_id: profile.id,
      booking_type: 'activity',
      activity_id: activity.id,
      slot_id: slot?.id ?? null,
      scheduled_at: scheduledAt,
      total_price: activity.price,
    });
    setMessage(error ? error.message : `Requested ${activity.name}.`);
  }

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
              products.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </View>
        </Tabs.Content>

        <Tabs.Content value="slaughter">
          <ThemedText type="small" themeColor="textSecondary" style={styles.help}>
            Book a whole animal and optionally invite others to split the cost and yield.
          </ThemedText>
          <TextInput
            value={invitees}
            onChangeText={setInvitees}
            placeholder="Invitee emails, comma separated"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          {offerings.length === 0 ? (
            <EmptyState title="No slaughter dates" body="This farm is not offering slaughter bookings." />
          ) : (
            offerings.map((offering) => (
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
                {slaughterSlots.slice(0, 3).map((slot) => (
                  <Button
                    key={slot.id}
                    size="sm"
                    variant="secondary"
                    onPress={() => bookSlaughter(offering, slot)}>
                    {new Date(slot.starts_at).toLocaleString()} · {slot.remaining} left
                  </Button>
                ))}
                {slaughterSlots.length === 0 ? (
                  <Button size="sm" onPress={() => bookSlaughter(offering)}>
                    Request a time
                  </Button>
                ) : null}
              </ThemedView>
            ))
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
                {activitySlots.slice(0, 3).map((slot) => (
                  <Button
                    key={slot.id}
                    size="sm"
                    variant="secondary"
                    onPress={() => bookActivity(activity, slot)}>
                    {new Date(slot.starts_at).toLocaleString()}
                  </Button>
                ))}
                {activitySlots.length === 0 ? (
                  <Button size="sm" onPress={() => bookActivity(activity)}>
                    Request a time
                  </Button>
                ) : null}
              </ThemedView>
            ))
          )}
        </Tabs.Content>
      </Tabs>

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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  message: {
    color: '#2F6B3A',
  },
});

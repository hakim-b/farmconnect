import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'heroui-native';

import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSupabase } from '@/hooks/use-supabase';
import { formatPrice, type Booking } from '@/lib/types';

export default function CustomerBookingsScreen() {
  const { profile } = useProfile();
  const supabase = useSupabase();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, farms(id, name), slaughter_offerings(id, name, animal_type), activities(id, name), booking_invitees(*)')
      .eq('customer_profile_id', profile.id)
      .order('scheduled_at', { ascending: true });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: number) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    await load();
  }

  if (loading) return <LoadingScreen />;

  return (
    <Screen>
      <ThemedText type="subtitle">Your bookings</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Slaughter appointments and farm activities you have requested.
      </ThemedText>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          body="Open a farm profile to book slaughter or an activity."
        />
      ) : (
        bookings.map((booking) => {
          const title =
            booking.slaughter_offerings?.name ?? booking.activities?.name ?? booking.booking_type;
          return (
            <ThemedView key={booking.id} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {booking.farms?.name} · {new Date(booking.scheduled_at).toLocaleString()}
              </ThemedText>
              <ThemedText type="small">
                {booking.status} · {formatPrice(booking.total_price)}
                {booking.booking_invitees && booking.booking_invitees.length > 0
                  ? ` · split with ${booking.booking_invitees.length}`
                  : ''}
              </ThemedText>
              {booking.status === 'pending' ? (
                <Button size="sm" variant="secondary" onPress={() => cancel(booking.id)}>
                  Cancel
                </Button>
              ) : null}
            </ThemedView>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});

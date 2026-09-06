import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'heroui-native';

import { Wordmark } from '@/components/logo';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSupabase } from '@/hooks/use-supabase';
import { formatPrice, type Booking, type BookingStatus } from '@/lib/types';

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Waiting for the farm to confirm',
  accepted: 'Confirmed',
  declined: 'Declined by the farm',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function cancel(id: number) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    await load();
  }

  if (loading) return <LoadingScreen />;

  return (
    <Screen>
      <Wordmark markSize={22} style={styles.brand} />
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
            booking.slaughter_offerings?.name ??
            booking.activities?.name ??
            (booking.booking_type === 'slaughter' ? 'Slaughter appointment' : 'Activity');
          const invitees = booking.booking_invitees ?? [];
          const emails = invitees.map((i) => i.invitee_email).filter(Boolean);
          return (
            <ThemedView key={booking.id} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {booking.farms?.name} · {new Date(booking.scheduled_at).toLocaleString()}
              </ThemedText>
              <ThemedText type="small">
                {STATUS_LABEL[booking.status]} · {formatPrice(booking.total_price)}
              </ThemedText>
              {emails.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Splitting with {emails.join(', ')}
                </ThemedText>
              ) : null}
              {booking.status === 'pending' || booking.status === 'accepted' ? (
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
  brand: { marginBottom: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});

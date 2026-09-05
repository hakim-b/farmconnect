import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { formatPrice, type Booking, type BookingStatus } from '@/lib/types';

export default function VendorBookingsScreen() {
  const { farm, loading, supabase } = useVendorFarm();
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, slaughter_offerings(id, name, animal_type), activities(id, name), booking_invitees(*)')
      .eq('farm_id', farm.id)
      .order('scheduled_at', { ascending: true });
    setBookings((data as Booking[]) ?? []);
  }, [farm, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) {
    return (
      <Screen>
        <EmptyState title="Create a farm first" body="Bookings appear after your farm is listed." />
      </Screen>
    );
  }

  async function setStatus(id: number, status: BookingStatus) {
    await supabase.from('bookings').update({ status }).eq('id', id);
    await load();
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Incoming bookings</ThemedText>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings" body="Customer slaughter and activity requests will land here." />
      ) : (
        bookings.map((booking) => {
          const title =
            booking.slaughter_offerings?.name ?? booking.activities?.name ?? booking.booking_type;
          return (
            <ThemedView key={booking.id} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(booking.scheduled_at).toLocaleString()} · {formatPrice(booking.total_price)} ·{' '}
                {booking.status}
              </ThemedText>
              {booking.notes ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {booking.notes}
                </ThemedText>
              ) : null}
              {booking.status === 'pending' ? (
                <View style={styles.row}>
                  <Button size="sm" onPress={() => setStatus(booking.id, 'accepted')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="secondary" onPress={() => setStatus(booking.id, 'declined')}>
                    Decline
                  </Button>
                </View>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});

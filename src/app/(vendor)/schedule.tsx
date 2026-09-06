import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AccountHeader } from '@/components/account-header';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { AddButton, BigRow, PillButton } from '@/components/vendor-ui';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import type { AvailabilitySlot } from '@/lib/types';

const offersSlaughter = (t: string) => t === 'slaughter_only' || t === 'mixed';

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
function formatRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString([], opts)} – ${new Date(endIso).toLocaleTimeString([], opts)}`;
}

export default function VendorScheduleScreen() {
  const router = useRouter();
  const { farm, loading, profile, supabase } = useVendorFarm();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const farmId = farm?.id;

  const load = useCallback(async () => {
    if (!farmId) return;
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('farm_id', farmId)
      .eq('slot_type', 'slaughter')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at');
    setSlots((data as AvailabilitySlot[]) ?? []);
  }, [farmId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) return null;

  if (!offersSlaughter(farm.farm_type)) {
    return (
      <Screen>
        <AccountHeader title="Slaughter times" profile={profile} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Your farm is set to “Produce &amp; meats”, so it doesn&apos;t offer slaughter. If that&apos;s
          not right, change your farm type from the dashboard.
        </ThemedText>
      </Screen>
    );
  }

  const removeSlot = (slot: AvailabilitySlot) => {
    const booked = slot.capacity - slot.remaining;
    if (booked > 0) {
      Alert.alert(
        'This time has bookings',
        `${booked} ${booked === 1 ? 'customer has' : 'customers have'} booked this time. You can't remove it.`,
      );
      return;
    }
    Alert.alert('Remove this time?', formatDay(slot.starts_at), [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('availability_slots').delete().eq('id', slot.id);
          if (error) Alert.alert('Could not remove', error.message);
          await load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <AccountHeader
        title="Slaughter times"
        subtitle="When customers can book you to slaughter an animal"
        profile={profile}
      />

      <AddButton label="Add a time" onPress={() => router.push('/vendor-slot')} />

      {slots.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          No times added yet. Tap the green button to set when you&apos;re available — pick a day, a
          start and end time, and how many animals you can handle.
        </ThemedText>
      ) : (
        slots.map((slot) => {
          const booked = slot.capacity - slot.remaining;
          return (
            <BigRow
              key={slot.id}
              title={formatDay(slot.starts_at)}
              subtitle={`${formatRange(slot.starts_at, slot.ends_at)} · ${booked} of ${slot.capacity} booked`}
              right={
                <PillButton label="Remove" tone="danger" onPress={() => removeSlot(slot)} />
              }
            />
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { lineHeight: 22 },
});

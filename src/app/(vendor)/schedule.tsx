import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AccountHeader } from '@/components/account-header';
import { FarmCalendar, dateKey, todayString } from '@/components/farm-calendar';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { AddButton, BigRow, PillButton } from '@/components/vendor-ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import type { AvailabilitySlot } from '@/lib/types';

const offersSlaughter = (t: string) => t === 'slaughter_only' || t === 'mixed';

function timeRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString([], opts)} – ${new Date(endIso).toLocaleTimeString([], opts)}`;
}

export default function VendorScheduleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { farm, loading, profile, supabase } = useVendorFarm();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState(todayString());

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const marks = useMemo(() => {
    const m: Record<string, { color: string }> = {};
    for (const s of slots) m[dateKey(new Date(s.starts_at))] = { color: theme.primary };
    return m;
  }, [slots, theme.primary]);

  const daySlots = useMemo(
    () => slots.filter((s) => dateKey(new Date(s.starts_at)) === selected),
    [slots, selected],
  );

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
    Alert.alert('Remove this time?', undefined, [
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

  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen>
      <AccountHeader
        title="Slaughter times"
        subtitle="Tap a day, then add the times you can slaughter"
        profile={profile}
      />

      <FarmCalendar selected={selected} onSelect={setSelected} marks={marks} />

      <View style={styles.dayHeader}>
        <ThemedText type="heading">{selectedLabel}</ThemedText>
      </View>

      {daySlots.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Nothing on this day yet.
        </ThemedText>
      ) : (
        daySlots.map((slot) => {
          const booked = slot.capacity - slot.remaining;
          return (
            <BigRow
              key={slot.id}
              title={timeRange(slot.starts_at, slot.ends_at)}
              subtitle={`${booked} of ${slot.capacity} booked`}
              right={
                <PillButton label="Remove" tone="danger" onPress={() => removeSlot(slot)} />
              }
            />
          );
        })
      )}

      <AddButton
        label={`Add a time on ${new Date(`${selected}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        onPress={() => router.push(`/vendor-slot?date=${selected}`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { lineHeight: 22 },
  dayHeader: { marginTop: Spacing.two },
});

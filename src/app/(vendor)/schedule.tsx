import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from 'heroui-native';

import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import type { AvailabilitySlot, SlotType } from '@/lib/types';

const PARSE_TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatShortDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function combineDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
}

function formatSlotTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function VendorScheduleScreen() {
  const theme = useTheme();
  const { farm, loading, supabase } = useVendorFarm();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotType, setSlotType] = useState<SlotType>('slaughter');
  const [date, setDate] = useState(() => startOfDay(new Date(Date.now() + 86400000)));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [capacity, setCapacity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const dates = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, index) => {
      const value = new Date(today);
      value.setDate(value.getDate() + index + 1);
      return value;
    });
  }, []);

  const load = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('farm_id', farm.id)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at');
    setSlots((data as AvailabilitySlot[]) ?? []);
  }, [farm, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) {
    return (
      <Screen>
        <EmptyState title="Create a farm first" body="Your dashboard has the farm profile form." />
      </Screen>
    );
  }

  async function createSlot() {
    if (!farm) return;
    setError(null);
    setMessage(null);
    if (!PARSE_TIME.test(startTime) || !PARSE_TIME.test(endTime)) {
      setError('Use 24-hour times like 09:00 and 10:30.');
      return;
    }
    const amount = Number(capacity);
    if (!Number.isFinite(amount) || amount < 1) {
      setError('Capacity must be at least 1.');
      return;
    }
    const startsAt = combineDateTime(date, startTime);
    const endsAt = combineDateTime(date, endTime);
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError('The slot must end after it starts.');
      return;
    }
    const { error: saveError } = await supabase.from('availability_slots').insert({
      farm_id: farm.id,
      slot_type: slotType,
      starts_at: startsAt,
      ends_at: endsAt,
      capacity: amount,
      remaining: amount,
    });
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setMessage(`Added a ${slotType} slot.`);
    await load();
  }

  async function deleteSlot(slot: AvailabilitySlot) {
    if (!farm) return;
    if (slot.remaining < slot.capacity) {
      setError('This slot has reservations. Raise its capacity instead of deleting it.');
      return;
    }
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slot.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setMessage('Slot removed.');
    await load();
  }

  async function bumpCapacity(slot: AvailabilitySlot) {
    if (!farm) return;
    const { error: updateError } = await supabase
      .from('availability_slots')
      .update({ capacity: slot.capacity + 1, remaining: slot.remaining + 1 })
      .eq('id', slot.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.backgroundSelected },
  ];

  return (
    <Screen>
      <ThemedText type="subtitle">Schedule</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Open booking windows for slaughter and activities. Customers pick from these when they book,
        and you manage capacity here.
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Add a slot</ThemedText>
        <View style={styles.row}>
          {(['slaughter', 'activity'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={slotType === value ? 'primary' : 'secondary'}
              onPress={() => setSlotType(value)}>
              {value}
            </Button>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {dates.map((value) => {
            const key = formatShortDate(value);
            const selected = formatShortDate(date) === key;
            return (
              <Pressable key={key} onPress={() => setDate(value)}>
                <ThemedView
                  type={selected ? 'backgroundSelected' : 'background'}
                  style={styles.chip}>
                  <ThemedText type="smallBold">{value.toLocaleDateString([], { weekday: 'short' })}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {value.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.timeRow}>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="Start (09:00)"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={[inputStyle, styles.timeInput]}
          />
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="End (10:00)"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={[inputStyle, styles.timeInput]}
          />
          <TextInput
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Capacity"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            style={[inputStyle, styles.capacityInput]}
          />
        </View>

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        {message ? (
          <ThemedText type="small" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}

        <Button isDisabled={!PARSE_TIME.test(startTime) || !PARSE_TIME.test(endTime)} onPress={createSlot}>
          Add slot
        </Button>
      </ThemedView>

      <View style={styles.section}>
        <ThemedText type="smallBold">Upcoming slots</ThemedText>
        {slots.length === 0 ? (
          <EmptyState title="No slots yet" body="Add slaughter or activity windows above." />
        ) : (
          slots.map((slot) => (
            <ThemedView key={slot.id} type="backgroundElement" style={styles.card}>
              <View style={styles.slotHeader}>
                <View style={styles.copy}>
                  <ThemedText type="smallBold">{formatSlotTime(slot.starts_at)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {slot.slot_type} · {slot.capacity - slot.remaining} of {slot.capacity} reserved
                  </ThemedText>
                </View>
                <View style={styles.row}>
                  {slot.remaining < slot.capacity ? (
                    <Button size="sm" variant="secondary" onPress={() => bumpCapacity(slot)}>
                      +1 capacity
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={slot.remaining < slot.capacity}
                    onPress={() => deleteSlot(slot)}>
                    Remove
                  </Button>
                </View>
              </View>
            </ThemedView>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipRow: {
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeInput: {
    flex: 1,
  },
  capacityInput: {
    width: 88,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  error: {
    color: '#B42318',
  },
  message: {
    color: '#2F6B3A',
  },
});
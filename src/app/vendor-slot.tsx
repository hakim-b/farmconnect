import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { LoadingScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Field, FormScreen, HourPicker, Stepper, formatHour } from '@/components/vendor-ui';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';

function parseDate(key: string | undefined): Date {
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t;
}

export default function VendorSlotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { farm, loading, supabase } = useVendorFarm();

  const day = parseDate(params.date);
  const [startHour, setStartHour] = useState<number | null>(9);
  const [endHour, setEndHour] = useState<number | null>(12);
  const [count, setCount] = useState(3);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!farm) return <Redirect href="/(vendor)" />;

  const valid = startHour != null && endHour != null && endHour > startHour;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const startsAt = new Date(day);
      startsAt.setHours(startHour!, 0, 0, 0);
      const endsAt = new Date(day);
      endsAt.setHours(endHour!, 0, 0, 0);
      const { error } = await supabase.from('availability_slots').insert({
        farm_id: farm.id,
        slot_type: 'slaughter',
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: count,
        remaining: count,
      });
      if (error) throw error;
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = day.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <FormScreen
      title={`Add a time on ${dayLabel}`}
      subtitle="Customers will book from the times you add."
      onBack={() => router.back()}
      onSave={save}
      saveLabel="Add this time"
      saveDisabled={!valid}
      saving={saving}>
      <Field label="Starts at">
        <HourPicker value={startHour} onChange={setStartHour} />
      </Field>

      <Field label="Ends at">
        <HourPicker value={endHour} onChange={setEndHour} />
      </Field>

      <Field label="How many animals can you do in this time?">
        <Stepper value={count} onChange={setCount} min={1} max={50} />
      </Field>

      <View style={{ paddingTop: Spacing.one }}>
        <ThemedText type="small" themeColor={valid ? 'primary' : 'textSecondary'}>
          {valid
            ? `${dayLabel}, ${formatHour(startHour!)} to ${formatHour(endHour!)} — ${count} ${
                count === 1 ? 'animal' : 'animals'
              }`
            : 'Pick a start and end time'}
        </ThemedText>
      </View>
    </FormScreen>
  );
}

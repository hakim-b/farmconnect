import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { LoadingScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import {
  DayPicker,
  Field,
  FormScreen,
  HourPicker,
  Stepper,
  formatHour,
} from '@/components/vendor-ui';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default function VendorSlotScreen() {
  const router = useRouter();
  const { farm, loading, supabase } = useVendorFarm();

  const days = useMemo(() => {
    const base = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const [day, setDay] = useState<Date>(days[1]); // tomorrow
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

  const summary = valid
    ? `${day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}, ${formatHour(
        startHour!,
      )} to ${formatHour(endHour!)} — ${count} ${count === 1 ? 'animal' : 'animals'}`
    : 'Pick a start and end time';

  return (
    <FormScreen
      title="Add a slaughter time"
      subtitle="Customers will book from the times you add here."
      onBack={() => router.back()}
      onSave={save}
      saveLabel="Add this time"
      saveDisabled={!valid}
      saving={saving}>
      <Field label="Which day?">
        <DayPicker days={days} value={day.toISOString().slice(0, 10)} onChange={setDay} />
      </Field>

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
          {summary}
        </ThemedText>
      </View>
    </FormScreen>
  );
}

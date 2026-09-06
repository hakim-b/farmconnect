import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { LoadingScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BigChoice } from '@/components/wizard';
import { Field, FormScreen, Segmented, Stepper } from '@/components/vendor-ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import {
  ITEM_KIND,
  PRODUCE_UNITS,
  itemKindsForFarm,
  type ItemKind,
  type ProduceUnit,
} from '@/lib/vendor-items';

type Draft = {
  name: string;
  price: string; // typed
  unit: ProduceUnit;
  quantity: number;
  trackStock: boolean;
  shares: number; // animal: how many families can share
};

const EMPTY: Draft = {
  name: '',
  price: '',
  unit: 'each',
  quantity: 10,
  trackStock: true,
  shares: 4,
};

export default function VendorItemScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; kind?: ItemKind }>();
  const { farm, loading, supabase } = useVendorFarm();

  const editingId = params.id ? Number(params.id) : null;
  const [kind, setKind] = useState<ItemKind | null>(params.kind ?? null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the row when editing.
  useEffect(() => {
    if (!editingId || !kind || seeded || !farm) return;
    (async () => {
      const { data } = await supabase
        .from(ITEM_KIND[kind].table)
        .select('*')
        .eq('id', editingId)
        .maybeSingle();
      if (data) {
        const row = data as Record<string, unknown>;
        setDraft({
          name: String(row.name ?? ''),
          price: row.price != null ? String(row.price) : '',
          unit: (PRODUCE_UNITS as readonly string[]).includes(String(row.unit))
            ? (row.unit as ProduceUnit)
            : 'each',
          quantity: Number(row.stock_quantity ?? 10),
          trackStock: row.stock_quantity != null,
          shares: Number(row.max_split_participants ?? 4),
        });
      }
      setSeeded(true);
    })();
  }, [editingId, kind, seeded, farm, supabase]);

  if (loading) return <LoadingScreen />;
  if (!farm) return <Redirect href="/(vendor)" />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // ---- kind picker (only when adding without a kind) ----
  if (!kind) {
    const kinds = itemKindsForFarm(farm.farm_type);
    return (
      <FormScreen title="What do you want to add?" onBack={() => router.back()}>
        <View style={{ gap: Spacing.three }}>
          {kinds.map((k) => (
            <BigChoice
              key={k}
              icon={ITEM_KIND[k].icon}
              title={ITEM_KIND[k].label}
              description={ITEM_KIND[k].blurb}
              selected={false}
              onPress={() => setKind(k)}
            />
          ))}
        </View>
      </FormScreen>
    );
  }

  if (editingId && !seeded) return <LoadingScreen />;

  const isProduct = kind === 'produce' || kind === 'meat';
  const priceNumber = Number(draft.price);
  const priceValid = draft.price.trim() !== '' && Number.isFinite(priceNumber) && priceNumber >= 0;
  const canSave = draft.name.trim().length > 1 && priceValid;

  const priceLabel =
    kind === 'produce'
      ? `Price per ${draft.unit === 'each' ? 'item' : draft.unit}`
      : kind === 'meat'
        ? 'Price per kg'
        : kind === 'animal'
          ? 'Price for the whole animal'
          : 'Price (put 0 if it is free)';

  const save = async () => {
    if (!canSave || saving || !farm) return;
    setSaving(true);
    try {
      const table = ITEM_KIND[kind].table;
      let payload: Record<string, unknown>;
      if (kind === 'produce' || kind === 'meat') {
        payload = {
          farm_id: farm.id,
          category: kind,
          name: draft.name.trim(),
          pricing_type: kind === 'meat' || draft.unit === 'kg' ? 'weight' : 'fixed',
          unit: kind === 'meat' ? 'kg' : draft.unit,
          price: priceNumber,
          stock_quantity: draft.trackStock ? draft.quantity : null,
        };
      } else if (kind === 'animal') {
        payload = {
          farm_id: farm.id,
          animal_type: draft.name.trim().toLowerCase(),
          name: draft.name.trim(),
          price: priceNumber,
          max_split_participants: draft.shares,
        };
      } else {
        payload = { farm_id: farm.id, name: draft.name.trim(), price: priceNumber };
      }

      const { error } = editingId
        ? await supabase.from(table).update(payload).eq('id', editingId)
        : await supabase.from(table).insert(payload);
      if (error) throw error;
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen
      title={editingId ? `Edit ${ITEM_KIND[kind].label.toLowerCase()}` : `Add ${ITEM_KIND[kind].label.toLowerCase()}`}
      onBack={() => (editingId || params.kind ? router.back() : setKind(null))}
      backLabel={editingId || params.kind ? 'Back' : 'Change type'}
      onSave={save}
      saveLabel={editingId ? 'Save changes' : 'Add to my items'}
      saveDisabled={!canSave}
      saving={saving}>
      <Field label={kind === 'animal' ? 'Which animal?' : 'What is it called?'}>
        <TextInput
          value={draft.name}
          onChangeText={(t) => set('name', t)}
          placeholder={kind === 'animal' ? 'Lamb' : kind === 'activity' ? 'Farm tour' : 'Tomatoes'}
          placeholderTextColor={theme.textSecondary}
          autoFocus={!editingId}
          autoCapitalize="words"
          style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
        />
      </Field>

      {kind === 'produce' ? (
        <Field label="Sold by">
          <Segmented
            value={draft.unit}
            onChange={(u) => set('unit', u)}
            options={PRODUCE_UNITS.map((u) => ({
              value: u,
              label: u === 'each' ? 'Each' : u[0].toUpperCase() + u.slice(1),
            }))}
          />
        </Field>
      ) : null}

      <Field label={priceLabel}>
        <View style={[styles.priceWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="heading" themeColor="textSecondary">
            $
          </ThemedText>
          <TextInput
            value={draft.price}
            onChangeText={(t) => set('price', t.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.priceInput, { color: theme.text }]}
          />
        </View>
      </Field>

      {isProduct ? (
        <Field label="How much do you have?">
          {draft.trackStock ? (
            <View style={{ gap: Spacing.two }}>
              <Stepper
                value={draft.quantity}
                onChange={(n) => set('quantity', n)}
                min={0}
                max={999}
                format={(n) => `${n} ${kind === 'meat' ? 'kg' : draft.unit === 'each' ? '' : draft.unit}`.trim()}
              />
              <ThemedText
                type="small"
                themeColor="textSecondary"
                onPress={() => set('trackStock', false)}
                style={styles.link}>
                I don't want to track this
              </ThemedText>
            </View>
          ) : (
            <ThemedView type="surface" style={[styles.notrack, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Not tracking stock for this item.
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="primary"
                onPress={() => set('trackStock', true)}
                style={styles.link}>
                Track it
              </ThemedText>
            </ThemedView>
          )}
        </Field>
      ) : null}

      {kind === 'animal' ? (
        <Field
          label="How many families can share one animal?"
          hint="Customers can split the cost and the meat.">
          <Stepper value={draft.shares} onChange={(n) => set('shares', n)} min={1} max={10} />
        </Field>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 18,
    minHeight: 56,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 56,
  },
  priceInput: { flex: 1, fontSize: 22, paddingVertical: Spacing.three },
  link: { textDecorationLine: 'underline' },
  notrack: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});

import { useAuth } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { LoadingScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BigChoice, WizardField, WizardShell, YesNo } from '@/components/wizard';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { toError } from '@/lib/errors';
import { FARM_TYPE_LABELS, slugify, type FarmType } from '@/lib/types';

type StepKey = 'name' | 'location' | 'type' | 'about' | 'certified' | 'visibility' | 'review';

const FARM_TYPES: FarmType[] = ['slaughter_only', 'produce_and_meats', 'mixed'];

const TYPE_COPY: Record<FarmType, { icon: Parameters<typeof SymbolView>[0]['name']; blurb: string }> = {
  slaughter_only: {
    icon: 'scissors',
    blurb: 'You slaughter and process animals. You do not sell produce.',
  },
  produce_and_meats: {
    icon: 'carrot.fill',
    blurb: 'You sell fruit, vegetables, eggs, or packaged meat. No slaughter.',
  },
  mixed: {
    icon: 'leaf.fill',
    blurb: 'You do both — sell produce and offer slaughter services.',
  },
};

type Draft = {
  name: string;
  city: string;
  address: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  farmType: FarmType;
  description: string;
  hasCert: boolean | null;
  certLabel: string;
  visible: boolean | null;
};

const EMPTY: Draft = {
  name: '',
  city: '',
  address: '',
  region: '',
  latitude: null,
  longitude: null,
  farmType: 'mixed',
  description: '',
  hasCert: null,
  certLabel: '',
  visible: null,
};

export default function FarmSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { farm, loading, profile, supabase } = useVendorFarm();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const steps = useMemo<StepKey[]>(
    () => ['name', 'location', 'type', 'about', 'certified', 'visibility', 'review'],
    [],
  );
  const step = steps[Math.min(i, steps.length - 1)];

  // --- guards ---
  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role-select" />;
  if (profile.role !== 'vendor') return <Redirect href="/(customer)" />;
  if (farm) return <Redirect href="/(vendor)" />;

  // On the first step there's nowhere to go back to (a signed-in vendor with
  // no farm is always routed here), so "Back" signs out instead.
  const goBack = () => {
    if (i === 0) void signOut();
    else setI((n) => n - 1);
  };
  const goToStep = (key: StepKey) => {
    const idx = steps.indexOf(key);
    if (idx >= 0) setI(idx);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert('Location is off', 'Please allow location, or type your address instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      set('latitude', Number(pos.coords.latitude.toFixed(6)));
      set('longitude', Number(pos.coords.longitude.toFixed(6)));
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place) {
        setDraft((d) => ({
          ...d,
          city: place.city ?? place.subregion ?? d.city,
          region: place.region ?? d.region,
          address:
            [place.streetNumber, place.street].filter(Boolean).join(' ') || d.address,
        }));
      }
    } catch {
      Alert.alert('Could not get your location', 'Please type your address instead.');
    } finally {
      setLocating(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 'name':
        return draft.name.trim().length > 1;
      case 'location':
        return draft.city.trim().length > 1;
      case 'certified':
        return draft.hasCert !== null && (!draft.hasCert || draft.certLabel.trim().length > 1);
      case 'visibility':
        return draft.visible !== null;
      default:
        return true;
    }
  };

  const submit = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .insert({
          owner_profile_id: profile.id,
          name: draft.name.trim(),
          slug: `${slugify(draft.name)}-${profile.id}`,
          description: draft.description.trim() || null,
          farm_type: draft.farmType,
          address_line: draft.address.trim() || null,
          city: draft.city.trim() || null,
          region: draft.region.trim() || null,
          latitude: draft.latitude,
          longitude: draft.longitude,
          is_published: draft.visible === true,
          eid_enabled: draft.farmType !== 'produce_and_meats',
        })
        .select()
        .single();
      if (error) throw error;

      if (draft.hasCert && draft.certLabel.trim() && data) {
        await supabase.from('farm_certifications').insert({
          farm_id: (data as { id: number }).id,
          label: draft.certLabel.trim(),
        });
      }
      router.replace('/(vendor)');
    } catch (err) {
      console.error('[farm-setup] create farm failed:', err);
      Alert.alert('Could not save your farm', toError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const onNext = () => {
    if (step === 'review') return submit();
    setI((n) => Math.min(n + 1, steps.length - 1));
  };

  const shell = (props: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    nextLabel?: string;
  }) => (
    <WizardShell
      step={i + 1}
      total={steps.length}
      title={props.title}
      subtitle={props.subtitle}
      onBack={goBack}
      backLabel={i === 0 ? 'Sign out' : 'Back'}
      onNext={onNext}
      nextLabel={props.nextLabel}
      nextDisabled={!canAdvance()}
      nextBusy={saving}>
      {props.children}
    </WizardShell>
  );

  if (step === 'name') {
    return shell({
      title: 'What is your farm called?',
      subtitle: 'This is the name customers will see.',
      children: (
        <WizardField
          label="Farm name"
          value={draft.name}
          onChangeText={(t) => set('name', t)}
          placeholder="Green Valley Farm"
          autoFocus
          autoCapitalize="words"
        />
      ),
    });
  }

  if (step === 'location') {
    return shell({
      title: 'Where is your farm?',
      subtitle: 'Tap the button to use where you are now, or type it in.',
      children: (
        <View style={{ gap: Spacing.three }}>
          <Pressable
            onPress={useCurrentLocation}
            disabled={locating}
            style={({ pressed }) => [
              styles.locBtn,
              { borderColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            {locating ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <SymbolView name="location.fill" size={20} tintColor={theme.primary} />
            )}
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Use my current location
            </ThemedText>
          </Pressable>

          <WizardField
            label="Town or city"
            value={draft.city}
            onChangeText={(t) => set('city', t)}
            placeholder="Saint-Rémi"
            autoCapitalize="words"
          />
          <WizardField
            label="Street address (optional)"
            value={draft.address}
            onChangeText={(t) => set('address', t)}
            placeholder="123 Rang Sainte-Marie"
          />
          <WizardField
            label="Province or state (optional)"
            value={draft.region}
            onChangeText={(t) => set('region', t)}
            placeholder="QC"
            autoCapitalize="characters"
          />
          {draft.latitude != null ? (
            <ThemedText type="small" themeColor="textSecondary">
              📍 Map pin saved.
            </ThemedText>
          ) : null}
        </View>
      ),
    });
  }

  if (step === 'type') {
    return shell({
      title: 'What does your farm do?',
      subtitle: 'Pick the closest match. You can change this later.',
      children: (
        <View style={{ gap: Spacing.three }}>
          {FARM_TYPES.map((t) => (
            <BigChoice
              key={t}
              icon={TYPE_COPY[t].icon}
              title={FARM_TYPE_LABELS[t]}
              description={TYPE_COPY[t].blurb}
              selected={draft.farmType === t}
              onPress={() => set('farmType', t)}
            />
          ))}
        </View>
      ),
    });
  }

  if (step === 'about') {
    return shell({
      title: 'Tell customers about your farm',
      subtitle: 'A sentence or two. You can skip this and add it later.',
      nextLabel: draft.description.trim() ? 'Next' : 'Skip',
      children: (
        <WizardField
          label="Short description (optional)"
          value={draft.description}
          onChangeText={(t) => set('description', t)}
          placeholder="Family-run farm. Grass-fed lamb and goat, hand slaughter on request."
          multiline
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
      ),
    });
  }

  if (step === 'certified') {
    return shell({
      title: 'Do you have a certification?',
      subtitle: 'For example, Halal Certified, Organic, or Grass-Fed.',
      children: (
        <View style={{ gap: Spacing.three }}>
          <YesNo value={draft.hasCert} onChange={(v) => set('hasCert', v)} />
          {draft.hasCert ? (
            <WizardField
              label="Certification name"
              value={draft.certLabel}
              onChangeText={(t) => set('certLabel', t)}
              placeholder="Halal Certified"
              hint="You can add more, and upload documents, from your dashboard."
            />
          ) : null}
        </View>
      ),
    });
  }

  if (step === 'visibility') {
    return shell({
      title: 'Show your farm to customers now?',
      subtitle: 'Choose "No" to keep it hidden while you finish setting up.',
      children: (
        <YesNo value={draft.visible} onChange={(v) => set('visible', v)} />
      ),
    });
  }

  // review
  const rows: { key: StepKey; label: string; value: string }[] = [
    { key: 'name', label: 'Farm name', value: draft.name.trim() || '—' },
    {
      key: 'location',
      label: 'Location',
      value: [draft.address.trim(), draft.city.trim(), draft.region.trim()]
        .filter(Boolean)
        .join(', ') || '—',
    },
    { key: 'type', label: 'Farm does', value: FARM_TYPE_LABELS[draft.farmType] },
    {
      key: 'about',
      label: 'Description',
      value: draft.description.trim() || 'None yet',
    },
    {
      key: 'certified',
      label: 'Certification',
      value: draft.hasCert ? draft.certLabel.trim() || 'Yes' : 'None',
    },
    {
      key: 'visibility',
      label: 'Visible to customers',
      value: draft.visible ? 'Yes, right away' : 'No, keep it hidden for now',
    },
  ];

  return shell({
    title: 'Check your farm details',
    subtitle: 'Tap any line to change it.',
    nextLabel: 'Create my farm',
    children: (
      <View style={{ gap: Spacing.two }}>
        {rows.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => goToStep(r.key)}
            style={({ pressed }) => [
              styles.reviewRow,
              { borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="eyebrow" themeColor="textSecondary">
                {r.label}
              </ThemedText>
              <ThemedText type="default">{r.value}</ThemedText>
            </View>
            <SymbolView name="pencil" size={16} tintColor={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    ),
  });
}

const styles = StyleSheet.create({
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 2,
    borderRadius: Radius.md,
    minHeight: 56,
    paddingHorizontal: Spacing.three,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 64,
  },
});

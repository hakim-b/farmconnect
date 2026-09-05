import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button } from 'heroui-native';

import { AccountHeader } from '@/components/account-header';
import { CertificationRow } from '@/components/farm-card';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { FARM_TYPE_LABELS, slugify, type FarmType } from '@/lib/types';

const FARM_TYPES: FarmType[] = ['mixed', 'produce_and_meats', 'slaughter_only'];

export default function VendorDashboardScreen() {
  const theme = useTheme();
  const { farm, loading, refresh, profile, supabase } = useVendorFarm();
  const [name, setName] = useState('');
  const [city, setCity] = useState('Ann Arbor');
  const [farmType, setFarmType] = useState<FarmType>('mixed');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certLabel, setCertLabel] = useState('');
  const [certDocumentUrl, setCertDocumentUrl] = useState('');

  if (loading) return <LoadingScreen />;

  async function createFarm() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from('farms').insert({
      owner_profile_id: profile.id,
      name: name.trim(),
      slug: `${slugify(name)}-${profile.id}`,
      description: description.trim() || null,
      farm_type: farmType,
      city: city.trim() || null,
      region: 'MI',
      is_published: true,
      eid_enabled: farmType !== 'produce_and_meats',
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await refresh();
  }

  async function togglePublished() {
    if (!farm) return;
    await supabase.from('farms').update({ is_published: !farm.is_published }).eq('id', farm.id);
    await refresh();
  }

  async function toggleEid() {
    if (!farm) return;
    await supabase.from('farms').update({ eid_enabled: !farm.eid_enabled }).eq('id', farm.id);
    await refresh();
  }

  async function addCertification() {
    if (!farm || certLabel.trim().length < 2) return;
    setError(null);
    const { error: insertError } = await supabase.from('farm_certifications').insert({
      farm_id: farm.id,
      label: certLabel.trim(),
      document_url: certDocumentUrl.trim() || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCertLabel('');
    setCertDocumentUrl('');
    await refresh();
  }

  async function removeCertification(certId: number) {
    if (!farm) return;
    const { error: deleteError } = await supabase
      .from('farm_certifications')
      .delete()
      .eq('id', certId);
    if (!deleteError) await refresh();
    else setError(deleteError.message);
  }

  return (
    <Screen>
      <AccountHeader title="Farm dashboard" profile={profile} />

      {!farm ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Create your farm profile</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Farm name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.input, styles.multiline, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <View style={styles.row}>
            {FARM_TYPES.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={farmType === type ? 'primary' : 'secondary'}
                onPress={() => setFarmType(type)}>
                {FARM_TYPE_LABELS[type]}
              </Button>
            ))}
          </View>
          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <Button isDisabled={saving || name.trim().length < 2} onPress={createFarm}>
            Publish farm
          </Button>
        </ThemedView>
      ) : (
        <>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{farm.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {FARM_TYPE_LABELS[farm.farm_type]} · {farm.city ?? 'No city set'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {farm.is_published ? 'Listed on the marketplace' : 'Hidden from customers'}
              {farm.eid_enabled ? ' · Eid queue on' : ''}
            </ThemedText>
            <CertificationRow labels={(farm.farm_certifications ?? []).map((item) => item.label)} />
            <View style={styles.row}>
              <Button size="sm" variant="secondary" onPress={togglePublished}>
                {farm.is_published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button size="sm" variant="secondary" onPress={toggleEid}>
                {farm.eid_enabled ? 'Disable Eid' : 'Enable Eid'}
              </Button>
            </View>

            <ThemedText type="smallBold">Certifications</ThemedText>
            <View style={styles.row}>
              {(farm.farm_certifications ?? []).map((cert) => (
                <Pressable key={cert.id} onPress={() => removeCertification(cert.id)}>
                  <View style={styles.certChip}>
                    <ThemedText type="small" style={styles.certText}>
                      {cert.label} ✕
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={certLabel}
              onChangeText={setCertLabel}
              placeholder="Certification label (e.g. Halal Certified)"
              placeholderTextColor={theme.textSecondary}
              style={{ color: theme.text, borderColor: theme.backgroundSelected, ...styles.input }}
            />
            <TextInput
              value={certDocumentUrl}
              onChangeText={setCertDocumentUrl}
              placeholder="Document URL (optional)"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: theme.text, borderColor: theme.backgroundSelected, ...styles.input }}
            />
            <Button
              isDisabled={certLabel.trim().length < 2}
              size="sm"
              variant="secondary"
              onPress={addCertification}>
              Add certification
            </Button>
          </ThemedView>
          <EmptyState
            title="Next: inventory and schedule"
            body="Add produce, meats, slaughter offerings, and activities from the Inventory tab. Incoming requests show up under Bookings."
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  certChip: {
    backgroundColor: '#E4F0E6',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 999,
  },
  certText: {
    color: '#2F6B3A',
    fontSize: 12,
  },
  error: {
    color: '#B42318',
  },
});

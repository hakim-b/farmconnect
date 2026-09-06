import { Redirect } from 'expo-router';
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
import { FARM_TYPE_LABELS } from '@/lib/types';

export default function VendorDashboardScreen() {
  const theme = useTheme();
  const { farm, loading, refresh, profile, supabase } = useVendorFarm();
  const [error, setError] = useState<string | null>(null);
  const [certLabel, setCertLabel] = useState('');
  const [certDocumentUrl, setCertDocumentUrl] = useState('');

  if (loading) return <LoadingScreen />;
  if (!farm) return <Redirect href="/farm-setup" />;

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

  const location = [farm.city, farm.region].filter(Boolean).join(', ') || 'No location set';

  return (
    <Screen>
      <AccountHeader title="Farm dashboard" profile={profile} />

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{farm.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {FARM_TYPE_LABELS[farm.farm_type]} · {location}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {farm.is_published ? 'Listed on the marketplace' : 'Hidden from customers'}
          {farm.eid_enabled ? ' · Eid queue on' : ''}
        </ThemedText>
        <CertificationRow labels={(farm.farm_certifications ?? []).map((item) => item.label)} />
        <View style={styles.row}>
          <Button size="sm" variant="secondary" onPress={togglePublished}>
            {farm.is_published ? 'Hide from customers' : 'Make visible'}
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
        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
      </ThemedView>

      <EmptyState
        title="Next: inventory and schedule"
        body="Add produce, meats, slaughter offerings, and activities from the Inventory tab. Incoming requests show up under Bookings."
      />
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

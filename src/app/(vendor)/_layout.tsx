import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/screen';
import VendorTabs from '@/components/vendor-tabs';
import { useVendorFarm } from '@/hooks/use-vendor-farm';

export default function VendorLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, farm, loading } = useVendorFarm();

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role-select" />;
  if (profile.role !== 'vendor') return <Redirect href="/(customer)" />;
  if (!farm) return <Redirect href="/farm-setup" />;

  return <VendorTabs />;
}

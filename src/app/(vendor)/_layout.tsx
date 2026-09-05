import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/screen';
import VendorTabs from '@/components/vendor-tabs';
import { useProfile } from '@/hooks/use-profile';

export default function VendorLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, loading } = useProfile();

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role-select" />;
  if (profile.role !== 'vendor') return <Redirect href="/(customer)" />;

  return <VendorTabs />;
}

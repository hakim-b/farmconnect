import { Redirect } from 'expo-router';

import CustomerTabs from '@/components/customer-tabs';
import { LoadingScreen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

export default function CustomerLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, loading } = useProfile();

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role-select" />;
  if (profile.role !== 'customer') return <Redirect href="/(vendor)" />;

  return <CustomerTabs />;
}

import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';

export default function Index() {
  const { isSignedIn, profile, loading } = useProfile();

  if (loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role-select" />;
  if (profile.role === 'vendor') return <Redirect href="/(vendor)" />;
  return <Redirect href="/(customer)" />;
}

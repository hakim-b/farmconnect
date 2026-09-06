import * as ImagePicker from 'expo-image-picker';

import { authedSupabase } from '@/lib/supabase';

const BUCKET = 'item-photos';

/** Open the camera or photo library and return a local file uri (or null if cancelled). */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      source === 'camera'
        ? 'Camera access is off. Turn it on in Settings, or choose a photo instead.'
        : 'Photo access is off. Turn it on in Settings, or take a photo instead.',
    );
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.6,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/** Upload a local image to Supabase Storage and return its public URL. */
export async function uploadItemPhoto(localUri: string): Promise<string> {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await fetch(localUri).then((r) => r.arrayBuffer());

  const { error } = await authedSupabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  return authedSupabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

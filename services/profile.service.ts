import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const PROFILE_AVATAR_KEY = 'profile_avatar_uri';

export async function getStoredProfileImageUri(): Promise<string | null> {
  return await SecureStore.getItemAsync(PROFILE_AVATAR_KEY);
}

export async function saveProfileImageUri(uri: string | null): Promise<void> {
  if (uri === null) {
    await SecureStore.deleteItemAsync(PROFILE_AVATAR_KEY);
    return;
  }
  await SecureStore.setItemAsync(PROFILE_AVATAR_KEY, uri);
}

export async function clearProfileImageUri(): Promise<void> {
  await SecureStore.deleteItemAsync(PROFILE_AVATAR_KEY);
}

/**
 * Copy picked image to app's document directory for persistence,
 * then return the new URI.
 */
export async function persistProfileImage(pickedUri: string): Promise<string> {
  const fileName = `profile_avatar_${Date.now()}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: pickedUri, to: destUri });
  return destUri;
}

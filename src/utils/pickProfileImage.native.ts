import * as ImagePicker from 'expo-image-picker';
import { copyUriToCacheIfNeeded } from './ensureLocalFileUri';
import { finalizeCroppedAvatar } from './finalizeCroppedAvatar';
import { PickedImage } from './pickedImageTypes';

export type { PickedImage } from './pickedImageTypes';

const PROFILE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  shape: 'rectangle',
  quality: 1,
  allowsMultipleSelection: false,
};

async function finalizeProfilePick(assetUri: string): Promise<PickedImage> {
  const localUri = await copyUriToCacheIfNeeded(assetUri, 'profile-source');
  const cropped = await finalizeCroppedAvatar(localUri);

  return {
    uri: cropped.uri,
    fileName: `profile-${Date.now()}.jpg`,
    mimeType: cropped.mimeType,
  };
}

export async function pickProfileImageFromLibrary(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Brak dostępu do galerii. Włącz uprawnienia w ustawieniach.');
  }

  const result = await ImagePicker.launchImageLibraryAsync(PROFILE_PICKER_OPTIONS);

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return finalizeProfilePick(result.assets[0].uri);
}

export async function pickProfileImageFromCamera(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Brak dostępu do aparatu. Włącz uprawnienia w ustawieniach.');
  }

  const result = await ImagePicker.launchCameraAsync(PROFILE_PICKER_OPTIONS);

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return finalizeProfilePick(result.assets[0].uri);
}

export async function pickAndCropProfileImage(): Promise<PickedImage | null> {
  return pickProfileImageFromLibrary();
}

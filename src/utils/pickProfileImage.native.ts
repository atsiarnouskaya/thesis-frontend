import * as ImagePicker from 'expo-image-picker';
import { finalizeCroppedAvatar } from './finalizeCroppedAvatar';
import { PickedImage } from './pickedImageTypes';

export type { PickedImage } from './pickedImageTypes';

export async function pickAndCropProfileImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Brak dostępu do galerii. Włącz uprawnienia w ustawieniach.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    shape: 'rectangle',
    quality: 1,
    allowsMultipleSelection: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const cropped = await finalizeCroppedAvatar(asset.uri);

  return {
    uri: cropped.uri,
    fileName: `profile-${Date.now()}.jpg`,
    mimeType: cropped.mimeType,
  };
}

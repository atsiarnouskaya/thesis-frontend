import * as ImagePicker from 'expo-image-picker';
import { finalizeIngredientImage } from './finalizeIngredientImage';
import { PickedImage } from './pickedImageTypes';

export type { PickedImage } from './pickedImageTypes';

async function finalizePick(assetUri: string, source: 'camera' | 'library'): Promise<PickedImage> {
  const finalized = await finalizeIngredientImage(assetUri);
  return {
    uri: finalized.uri,
    fileName: `ingredient-${source}-${Date.now()}.jpg`,
    mimeType: finalized.mimeType,
  };
}

export async function pickIngredientImageFromLibrary(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Brak dostępu do galerii. Włącz uprawnienia w ustawieniach.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
    allowsMultipleSelection: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return finalizePick(result.assets[0].uri, 'library');
}

export async function pickIngredientImageFromCamera(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Brak dostępu do aparatu. Włącz uprawnienia w ustawieniach.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return finalizePick(result.assets[0].uri, 'camera');
}

import { PickedImage } from './pickedImageTypes';
import { pickImageFileFromBrowser } from './webCropBridge';

export type { PickedImage } from './pickedImageTypes';

async function pickFromBrowser(source: 'camera' | 'library'): Promise<PickedImage | null> {
  const file = await pickImageFileFromBrowser();
  if (!file) {
    return null;
  }

  return {
    uri: URL.createObjectURL(file),
    fileName: `ingredient-${source}-${Date.now()}.jpg`,
    mimeType: file.type || 'image/jpeg',
  };
}

export async function pickIngredientImageFromLibrary(): Promise<PickedImage | null> {
  return pickFromBrowser('library');
}

export async function pickIngredientImageFromCamera(): Promise<PickedImage | null> {
  return pickFromBrowser('library');
}

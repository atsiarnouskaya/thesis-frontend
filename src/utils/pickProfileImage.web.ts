import { PickedImage } from './pickedImageTypes';
import { pickImageFileFromBrowser, requestWebCrop } from './webCropBridge';

export type { PickedImage } from './pickedImageTypes';

export async function pickProfileImageFromLibrary(): Promise<PickedImage | null> {
  return pickAndCropProfileImage();
}

export async function pickProfileImageFromCamera(): Promise<PickedImage | null> {
  return pickAndCropProfileImage();
}

export async function pickAndCropProfileImage(): Promise<PickedImage | null> {
  const file = await pickImageFileFromBrowser();
  if (!file) {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const cropped = await requestWebCrop(objectUrl);
    if (!cropped) {
      return null;
    }

    return {
      ...cropped,
      fileName: `profile-${Date.now()}.jpg`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

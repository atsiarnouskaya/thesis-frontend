import { PickedImage } from './pickedImageTypes';

type CropRequest = {
  imageUrl: string;
  resolve: (value: PickedImage | null) => void;
};

let hostHandler: ((request: CropRequest) => void) | null = null;

export function registerWebCropHost(handler: (request: CropRequest) => void): () => void {
  hostHandler = handler;
  return () => {
    if (hostHandler === handler) {
      hostHandler = null;
    }
  };
}

export function requestWebCrop(imageUrl: string): Promise<PickedImage | null> {
  return new Promise((resolve, reject) => {
    if (!hostHandler) {
      reject(new Error('Interfejs kadrowania nie jest gotowy. Odśwież stronę.'));
      return;
    }

    hostHandler({ imageUrl, resolve });
  });
}

export function pickImageFileFromBrowser(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
    };
    input.click();
  });
}

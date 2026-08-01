import { AVATAR_UPLOAD_PIXEL_SIZE } from './finalizeCroppedAvatar';

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export async function createCroppedImageFromArea(
  imageSrc: string,
  pixelCrop: CropArea,
): Promise<{ uri: string; mimeType: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_UPLOAD_PIXEL_SIZE;
  canvas.height = AVATAR_UPLOAD_PIXEL_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nie udało się przygotować podglądu kadrowania');
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    AVATAR_UPLOAD_PIXEL_SIZE,
    AVATAR_UPLOAD_PIXEL_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Nie udało się zapisać przyciętego zdjęcia'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      0.9,
    );
  });

  return {
    uri: URL.createObjectURL(blob),
    mimeType: 'image/jpeg',
  };
}

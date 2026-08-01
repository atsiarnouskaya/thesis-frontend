import * as ImageManipulator from 'expo-image-manipulator';

export const AVATAR_UPLOAD_PIXEL_SIZE = 512;

export async function finalizeCroppedAvatar(
  uri: string,
): Promise<{ uri: string; mimeType: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_UPLOAD_PIXEL_SIZE, height: AVATAR_UPLOAD_PIXEL_SIZE } }],
    {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
  };
}

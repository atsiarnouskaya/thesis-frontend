import * as ImageManipulator from 'expo-image-manipulator';

const MAX_UPLOAD_WIDTH = 1600;

export async function finalizeIngredientImage(
  uri: string,
): Promise<{ uri: string; mimeType: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_UPLOAD_WIDTH } }],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
  };
}

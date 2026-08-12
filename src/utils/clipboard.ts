import { Platform, Share } from 'react-native';

export async function copyTextToClipboard(text: string): Promise<void> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  await Share.share({ message: text });
}

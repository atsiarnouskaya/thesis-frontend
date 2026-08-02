import { Platform } from 'react-native';
import { colors } from './colors';

export function applyWebGlobalStyles(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  const { body, documentElement: html } = document;
  body.style.margin = '0';
  body.style.backgroundColor = colors.background;
  body.style.fontFamily =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  html.style.height = '100%';
  body.style.minHeight = '100%';

  const root = document.getElementById('root');
  if (root) {
    root.style.minHeight = '100%';
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
  }
}

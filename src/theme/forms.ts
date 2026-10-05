import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { colors } from './colors';

export const webPointer: ViewStyle =
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : {};

export const cardElevation: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 16px 48px rgba(8, 28, 21, 0.09)',
  } as ViewStyle,
  default: {
    shadowColor: '#081C15',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
}) as ViewStyle;

export const formStyles = StyleSheet.create({
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
    color: colors.textMuted,
    lineHeight: 22,
  },
  label: {
    marginBottom: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    marginBottom: 14,
    color: colors.text,
    backgroundColor: '#FAFCFA',
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as ViewStyle)
      : {}),
  },
  inputFocused: {
    borderColor: colors.primaryMuted,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
  success: {
    color: colors.primary,
    marginBottom: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    ...webPointer,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...webPointer,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  link: {
    color: colors.primaryMuted,
    fontWeight: '600',
    ...webPointer,
  },
});

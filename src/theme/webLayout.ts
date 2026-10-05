import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const webPageStyles = StyleSheet.create({
  pageHeader: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageLead: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
    maxWidth: 640,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  breadcrumbSep: {
    color: colors.textMuted,
  },
  breadcrumbCurrent: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
});

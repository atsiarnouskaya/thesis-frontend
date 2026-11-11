import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { colors } from '../theme/colors';
import { cardElevation, webPointer } from '../theme/forms';

export type ConfirmDialogVariant = 'default' | 'destructive';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onCancel} disabled={isLoading} />
        <View style={[styles.dialog, cardElevation]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, webPointer, isLoading && styles.buttonDisabled]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{resolvedCancel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                variant === 'destructive' && styles.confirmButtonDestructive,
                webPointer,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>{resolvedConfirm}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 28, 21, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmButtonDestructive: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

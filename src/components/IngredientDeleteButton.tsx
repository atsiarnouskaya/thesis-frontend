import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { webPointer } from '../theme/forms';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

function CloseIcon() {
  return (
    <View style={styles.icon}>
      <View style={[styles.iconLine, styles.iconLineA]} />
      <View style={[styles.iconLine, styles.iconLineB]} />
    </View>
  );
}

export function IngredientDeleteButton({ onPress, disabled = false, isLoading = false }: Props) {
  const { t } = useI18n();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && !isLoading && styles.buttonPressed,
        webPointer,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityLabel={t('ingredient.deleteA11y')}
      accessibilityRole="button"
      hitSlop={8}
    >
      {isLoading ? <ActivityIndicator color={colors.error} size="small" /> : <CloseIcon />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    backgroundColor: colors.dangerBg,
    borderColor: '#E8B4B4',
  },
  icon: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLine: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
  },
  iconLineA: {
    transform: [{ rotate: '45deg' }],
  },
  iconLineB: {
    transform: [{ rotate: '-45deg' }],
  },
});

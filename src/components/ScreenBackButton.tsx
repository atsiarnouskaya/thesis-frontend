import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { webPointer } from '../theme/forms';

type ScreenBackButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
};

export function ScreenBackButton({
  onPress,
  disabled,
  label = 'Wstecz',
}: ScreenBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.root, disabled && styles.disabled, webPointer]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>←</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 4,
    paddingRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});

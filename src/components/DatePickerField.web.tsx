import React from 'react';
import { Platform, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { FormTextInput } from './FormTextInput';
import { webPointer } from '../theme/forms';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  editable?: boolean;
  placeholder?: string;
};

export function DatePickerField({
  value,
  onChange,
  onBlur,
  editable = true,
  placeholder = 'Wybierz datę',
}: Props) {
  return (
    <FormTextInput
      {...({ type: 'date' } as TextInputProps)}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      editable={editable}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      style={[styles.webInput, webPointer as ViewStyle]}
    />
  );
}

const styles = StyleSheet.create({
  webInput: {
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : {}),
  },
});

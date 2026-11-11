import React from 'react';
import { Platform, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
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
  placeholder,
}: Props) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t('datePicker.placeholder');

  return (
    <FormTextInput
      {...({ type: 'date' } as TextInputProps)}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      editable={editable}
      placeholder={resolvedPlaceholder}
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

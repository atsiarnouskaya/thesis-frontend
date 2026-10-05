import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { formStyles } from '../theme/forms';

type Props = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function FormField({ label, hint, children, style }: Props) {
  return (
    <View style={[styles.field, style]}>
      <Text style={formStyles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 5,
    marginBottom: 4,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
});

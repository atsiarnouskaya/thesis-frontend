import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';
import { formStyles } from '../theme/forms';

export function FormTextInput(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[
        formStyles.input,
        focused && formStyles.inputFocused,
        props.style,
        Platform.OS === 'web' ? styles.webInput : null,
      ]}
      placeholderTextColor={props.placeholderTextColor}
    />
  );
}

const styles = StyleSheet.create({
  webInput: {
    fontSize: 16,
  },
});

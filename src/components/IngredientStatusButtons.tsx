import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { webPointer } from '../theme/forms';

type Props = {
  onConsume: () => void;
  onDiscard: () => void;
  isConsumePending?: boolean;
  isDiscardPending?: boolean;
  disabled?: boolean;
  layout?: 'row' | 'stack';
  plain?: boolean;
};

export function IngredientStatusButtons({
  onConsume,
  onDiscard,
  isConsumePending = false,
  isDiscardPending = false,
  disabled = false,
  layout = 'row',
  plain = false,
}: Props) {
  const isBusy = disabled || isConsumePending || isDiscardPending;

  return (
    <View
      style={[
        styles.container,
        layout === 'stack' && styles.containerStack,
        plain && styles.containerPlain,
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.consumeButton,
          layout === 'stack' && styles.buttonStack,
          pressed && !isBusy && styles.consumeButtonPressed,
          webPointer,
        ]}
        onPress={onConsume}
        disabled={isBusy}
      >
        {isConsumePending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.consumeButtonText}>Zjedzone</Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.discardButton,
          layout === 'stack' && styles.buttonStack,
          pressed && !isBusy && styles.discardButtonPressed,
          webPointer,
        ]}
        onPress={onDiscard}
        disabled={isBusy}
      >
        {isDiscardPending ? (
          <ActivityIndicator color={colors.textMuted} size="small" />
        ) : (
          <Text style={styles.discardButtonText}>Wyrzucone</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  containerStack: {
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  containerPlain: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 0,
  },
  consumeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    minHeight: 40,
  },
  consumeButtonPressed: {
    backgroundColor: colors.primaryMuted,
  },
  consumeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  discardButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
  },
  discardButtonPressed: {
    backgroundColor: '#FAFCFA',
    borderColor: colors.textMuted,
  },
  discardButtonText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  buttonStack: {
    flex: 0,
    width: '100%',
  },
});

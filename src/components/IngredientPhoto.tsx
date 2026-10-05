import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { toDataUri } from '../utils/base64';

type Props = {
  ingredientPicture: string;
  size?: number;
  borderRadius?: number;
};

export function IngredientPhoto({ ingredientPicture, size = 56, borderRadius = 12 }: Props) {
  const imageUri = toDataUri(ingredientPicture);

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius }]}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    flexShrink: 0,
  },
});

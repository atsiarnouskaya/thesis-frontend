import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { toDataUri } from '../utils/base64';

type Props = {
  username: string;
  avatarBase64?: string;
  size?: number;
  editable?: boolean;
  onPress?: () => void;
};

export function ProfileAvatar({ username, avatarBase64, size = 96, editable = false, onPress }: Props) {
  const initials = username.trim().slice(0, 2).toUpperCase() || '?';
  const imageUri = avatarBase64 ? toDataUri(avatarBase64) : null;

  const content = (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
        </View>
      )}
      {editable && !imageUri ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#D8E2DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
});

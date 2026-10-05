import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type TabIconName = 'fridge' | 'profile';

type Props = {
  name: TabIconName;
  color: string;
  focused: boolean;
  size?: number;
};

function FridgeIcon({ color, size }: { color: string; size: number }) {
  const width = size * 0.62;
  const height = size * 0.82;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width,
          height,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: height * 0.22, borderBottomWidth: 2, borderBottomColor: color }} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View
            style={{
              alignSelf: 'center',
              width: width * 0.22,
              height: height * 0.2,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        </View>
        <View style={{ height: height * 0.2, borderTopWidth: 2, borderTopColor: color }} />
      </View>
    </View>
  );
}

function ProfileIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const head = size * 0.3;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: head,
          height: head,
          borderRadius: head / 2,
          borderWidth: 2,
          borderColor: color,
          backgroundColor: focused ? color : 'transparent',
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: size * 0.58,
          height: size * 0.28,
          borderTopLeftRadius: size * 0.28,
          borderTopRightRadius: size * 0.28,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

export function MobileTabBarIcon({ name, color, focused, size = 24 }: Props) {
  return (
    <View style={styles.wrap}>
      {name === 'fridge' ? <FridgeIcon color={color} size={size} /> : null}
      {name === 'profile' ? <ProfileIcon color={color} size={size} focused={focused} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },
});

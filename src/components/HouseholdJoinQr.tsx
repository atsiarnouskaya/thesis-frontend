import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import QRCode from 'qrcode';
import { buildHouseholdJoinUrl } from '../household/joinLink';
import { colors } from '../theme/colors';

type Props = {
  inviteCode: string;
  size?: number;
};

export function HouseholdJoinQr({ inviteCode, size = 200 }: Props) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const joinUrl = buildHouseholdJoinUrl(inviteCode);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDataUri(null);

    QRCode.toDataURL(joinUrl, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((uri) => {
        if (!cancelled) {
          setDataUri(uri);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [joinUrl, size]);

  if (failed || !dataUri) {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: dataUri }}
      style={{ width: size, height: size, borderRadius: 12 }}
      accessibilityLabel="Kod QR do dołączenia do lodówki"
    />
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

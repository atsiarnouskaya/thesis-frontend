import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { buildHouseholdJoinUrl } from '../household/joinLink';
import { useI18n } from '../i18n/I18nContext';
import { colors } from '../theme/colors';

type Props = {
  inviteCode: string;
  size?: number;
};

type QrMatrix = {
  cells: boolean[][];
  moduleCount: number;
};

// qrcode/lib/core/qrcode działa w React Native - bez canvas w przeciwieństwie do toDataURL().
const QRCodeCore = require('qrcode/lib/core/qrcode') as {
  create: (
    data: string,
    options?: { errorCorrectionLevel?: string },
  ) => {
    modules: {
      size: number;
      get: (row: number, col: number) => boolean;
    };
  };
};

function buildQrMatrix(value: string): QrMatrix {
  const { modules } = QRCodeCore.create(value, { errorCorrectionLevel: 'M' });
  const moduleCount = modules.size;
  const cells: boolean[][] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    const rowCells: boolean[] = [];
    for (let col = 0; col < moduleCount; col += 1) {
      rowCells.push(Boolean(modules.get(row, col)));
    }
    cells.push(rowCells);
  }

  return { cells, moduleCount };
}

export function HouseholdJoinQr({ inviteCode, size = 200 }: Props) {
  const { t } = useI18n();
  const joinUrl = buildHouseholdJoinUrl(inviteCode);

  const matrix = useMemo(() => {
    try {
      return buildQrMatrix(joinUrl);
    } catch {
      return null;
    }
  }, [joinUrl]);

  if (!matrix) {
    return (
      <View style={[styles.box, styles.boxError, { width: size, height: size }]}>
        <Text style={styles.errorText}>{t('household.joinQrFailed')}</Text>
      </View>
    );
  }

  const cellSize = size / matrix.moduleCount;

  return (
    <View
      style={[styles.box, { width: size, height: size }]}
      accessibilityLabel={t('household.joinQrA11y')}
    >
      {matrix.cells.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { height: cellSize }]}>
          {row.map((isDark, colIndex) => (
            <View
              key={`cell-${rowIndex}-${colIndex}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: isDark ? colors.text : '#FFFFFF',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  boxError: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
  },
});

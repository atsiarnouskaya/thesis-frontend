import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { processReceiptImage, RECEIPT_SHOPS, ReceiptShop } from '../api/receipt';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { ScreenShell } from '../components/ScreenShell';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { HouseholdStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/I18nContext';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import {
  pickIngredientImageFromCamera,
  pickIngredientImageFromLibrary,
  PickedImage,
} from '../utils/pickIngredientImage';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'ReceiptScan'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ReceiptScanScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { householdId, householdName } = route.params;
  const { isWideWeb } = useResponsiveLayout();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [shop, setShop] = useState<ReceiptShop>('BIEDRONKA');
  const [pendingImage, setPendingImage] = useState<PickedImage | null>(null);
  const [previewAspectRatio, setPreviewAspectRatio] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNativeMobile && permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [isNativeMobile, permission, requestPermission]);

  useEffect(() => {
    if (!pendingImage) {
      setPreviewAspectRatio(null);
      return;
    }

    Image.getSize(
      pendingImage.uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          setPreviewAspectRatio(width / height);
        }
      },
      () => setPreviewAspectRatio(3 / 4),
    );
  }, [pendingImage]);

  const setImageFromPick = (picked: PickedImage) => {
    setError(null);
    setPendingImage(picked);
  };

  const onAnalyze = useCallback(async () => {
    if (!pendingImage || isAnalyzing) {
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await processReceiptImage(householdId, shop, pendingImage);
      if (result.items.length === 0) {
        setError(t('receipt.ocrEmpty'));
        return;
      }

      navigation.replace('ReceiptProducts', {
        householdId,
        householdName,
        items: result.items,
      });
    } catch (err) {
      setError(errorMessage(err, t('receipt.ocrFailed')));
    } finally {
      setIsAnalyzing(false);
    }
  }, [householdId, householdName, isAnalyzing, navigation, pendingImage, shop, t]);

  const onPickFromGallery = useCallback(async () => {
    if (isAnalyzing) {
      return;
    }

    setError(null);
    try {
      const picked = await pickIngredientImageFromLibrary();
      if (!picked) {
        return;
      }
      setImageFromPick(picked);
    } catch (err) {
      setError(errorMessage(err, t('receipt.pickFailed')));
    }
  }, [isAnalyzing, t]);

  const onPickFromCameraFallback = async () => {
    if (isAnalyzing) {
      return;
    }

    setError(null);
    try {
      const picked = await pickIngredientImageFromCamera();
      if (!picked) {
        return;
      }
      setImageFromPick(picked);
    } catch (err) {
      setError(errorMessage(err, t('receipt.photoFailed')));
    }
  };

  const onCaptureFromLiveCamera = async () => {
    if (isAnalyzing || !cameraRef.current) {
      return;
    }

    setError(null);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!picture?.uri) {
        throw new Error(t('receipt.captureFailed'));
      }
      const fileName = picture.uri.split('/').pop() ?? 'receipt.jpg';
      setImageFromPick({ uri: picture.uri, fileName, mimeType: 'image/jpeg' });
    } catch (err) {
      setError(errorMessage(err, t('receipt.captureFailed')));
    }
  };

  const clearPendingImage = () => {
    if (isAnalyzing) {
      return;
    }
    setPendingImage(null);
    setError(null);
  };

  const showLiveCamera =
    isNativeMobile && permission?.granted && !pendingImage && !isAnalyzing;
  const controlsDisabled = isAnalyzing;

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[styles.shell, isWideWeb && styles.shellWide]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <ScreenBackButton onPress={() => navigation.goBack()} disabled={isAnalyzing} />

          <Text style={styles.title}>{t('receipt.scanTitle')}</Text>
          <Text style={styles.lead}>{t('receipt.scanLead')}</Text>

          <View style={styles.shopSection}>
            <Text style={styles.shopLabel}>{t('receipt.stepShop')}</Text>
            <View style={[styles.shopRow, isWideWeb && styles.shopRowWide]}>
              {RECEIPT_SHOPS.map((entry) => {
                const isActive = shop === entry;
                return (
                  <Pressable
                    key={entry}
                    style={[styles.shopChip, isActive && styles.shopChipActive, webPointer]}
                    onPress={() => setShop(entry)}
                    disabled={controlsDisabled}
                  >
                    <Text style={[styles.shopChipText, isActive && styles.shopChipTextActive]}>
                      {t(`receipt.shop.${entry}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.shopLabel}>{t('receipt.stepPhoto')}</Text>

          {showLiveCamera ? (
            <View style={styles.cameraBox}>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.cameraHint}>{t('receipt.frameHint')}</Text>
              </View>
            </View>
          ) : pendingImage ? (
            <View style={styles.previewBox}>
              <View style={styles.previewFrame}>
                <Image
                  source={{ uri: pendingImage.uri }}
                  style={[
                    styles.previewImage,
                    previewAspectRatio != null ? { aspectRatio: previewAspectRatio } : null,
                  ]}
                  resizeMode="contain"
                />
              </View>
              {!isAnalyzing ? (
                <Pressable
                  style={[styles.changePhotoLink, webPointer]}
                  onPress={clearPendingImage}
                  disabled={controlsDisabled}
                >
                  <Text style={formStyles.link}>{t('receipt.changePhoto')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackText}>
                {Platform.OS === 'web'
                  ? t('receipt.fallbackWeb')
                  : permission?.granted
                    ? t('receipt.fallbackMobile')
                    : t('receipt.fallbackPermission')}
              </Text>
              {isNativeMobile && !permission?.granted ? (
                <Pressable
                  style={[formStyles.primaryButton, styles.actionButton, webPointer]}
                  onPress={() => void requestPermission()}
                >
                  <Text style={formStyles.primaryButtonText}>{t('receipt.allowCamera')}</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {isAnalyzing ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.analyzingText}>{t('receipt.analyzing')}</Text>
              <Text style={styles.analyzingHint}>{t('receipt.analyzingHint')}</Text>
            </View>
          ) : null}

          {!pendingImage ? (
            <View style={[styles.actions, isWideWeb && styles.actionsWide]}>
              {showLiveCamera ? (
                <Pressable
                  style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
                  onPress={() => void onCaptureFromLiveCamera()}
                  disabled={controlsDisabled}
                >
                  <Text style={formStyles.secondaryButtonText}>{t('receipt.takePhoto')}</Text>
                </Pressable>
              ) : null}

              {Platform.OS === 'web' ? (
                <Pressable
                  style={[formStyles.secondaryButton, styles.compactButton, webPointer]}
                  onPress={() => void onPickFromGallery()}
                  disabled={controlsDisabled}
                >
                  <Text style={formStyles.secondaryButtonText}>{t('receipt.pickPhoto')}</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
                    onPress={() => void onPickFromCameraFallback()}
                    disabled={controlsDisabled}
                  >
                    <Text style={formStyles.secondaryButtonText}>{t('receipt.takePhotoCamera')}</Text>
                  </Pressable>
                  <Pressable
                    style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
                    onPress={() => void onPickFromGallery()}
                    disabled={controlsDisabled}
                  >
                    <Text style={formStyles.secondaryButtonText}>{t('receipt.pickGallery')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}

          {pendingImage ? (
            <View style={styles.analyzeSection}>
              <Text style={styles.shopLabel}>{t('receipt.stepAnalyze')}</Text>
              <Pressable
                style={[
                  formStyles.primaryButton,
                  styles.compactButton,
                  isAnalyzing && formStyles.buttonDisabled,
                  webPointer,
                ]}
                onPress={() => void onAnalyze()}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={formStyles.primaryButtonText}>{t('receipt.analyze')}</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {error ? <Text style={formStyles.error}>{error}</Text> : null}
        </AppPageFrame>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 720,
  },
  shellWide: {
    maxWidth: 960,
  },
  frameWide: {
    gap: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  lead: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
    fontSize: 15,
  },
  shopSection: {
    marginBottom: 16,
    gap: 10,
  },
  shopLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  shopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopRowWide: {
    gap: 10,
  },
  shopChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFCFA',
  },
  shopChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shopChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  shopChipTextActive: {
    color: '#fff',
  },
  cameraBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    backgroundColor: '#000',
    minHeight: 260,
  },
  camera: {
    width: '100%',
    height: 280,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanFrame: {
    width: '88%',
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cameraHint: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  fallbackBox: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  fallbackText: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
  },
  previewBox: {
    marginBottom: 16,
    gap: 8,
  },
  previewFrame: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#fff',
  },
  compactButton: {
    alignSelf: 'flex-start',
    minWidth: 148,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  changePhotoLink: {
    alignSelf: 'flex-start',
  },
  analyzingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  analyzingHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  analyzeSection: {
    gap: 10,
    marginBottom: 8,
    width: '100%',
  },
  actions: {
    gap: 10,
    marginBottom: 8,
  },
  actionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

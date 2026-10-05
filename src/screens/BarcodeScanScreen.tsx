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
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BarcodeProduct,
  isValidBarcode,
  lookupIngredientByBarcode,
  normalizeBarcodeInput,
  scanBarcodeFromImage,
} from '../api/ingredientBarcode';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { ScreenShell } from '../components/ScreenShell';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import {
  pickIngredientImageFromCamera,
  pickIngredientImageFromLibrary,
} from '../utils/pickIngredientImage';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'BarcodeScan'>;

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] as const;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function buildPrefillNotes(product: BarcodeProduct): string | null {
  const parts = [product.brand, product.quantity, product.categories].filter(Boolean);
  if (parts.length === 0) {
    return `Kod kreskowy: ${product.barcode}`;
  }
  return `${parts.join(' · ')} · Kod: ${product.barcode}`;
}

export function BarcodeScanScreen({ navigation, route }: Props) {
  const { householdId, householdName } = route.params;
  const { isWideWeb } = useResponsiveLayout();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState('Skieruj aparat na kod kreskowy produktu');

  useEffect(() => {
    if (isNativeMobile && permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [isNativeMobile, permission, requestPermission]);

  const lookupBarcode = useCallback(
    async (rawBarcode: string) => {
      const normalized = normalizeBarcodeInput(rawBarcode);
      if (!isValidBarcode(normalized)) {
        throw new ApiError('Nie rozpoznano prawidłowego kodu kreskowego', 400);
      }

      return lookupIngredientByBarcode(householdId, normalized);
    },
    [householdId],
  );

  const resetScanner = () => {
    scanLockRef.current = false;
    setProduct(null);
    setPreviewUri(null);
    setError(null);
    setScanHint('Skieruj aparat na kod kreskowy produktu');
  };

  const onBarcodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (scanLockRef.current || isScanning) {
        return;
      }

      scanLockRef.current = true;
      setError(null);
      setIsScanning(true);
      setScanHint('Wyszukiwanie produktu…');

      try {
        const result = await lookupBarcode(data);
        setProduct(result);
        setScanHint(`Znaleziono kod: ${result.barcode}`);
      } catch (err) {
        setError(errorMessage(err, 'Nie udało się wyszukać produktu po kodzie'));
        scanLockRef.current = false;
        setScanHint('Spróbuj ponownie - ustaw kod w kadrze');
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, lookupBarcode],
  );

  const scanCapturedImage = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setProduct(null);
    setPreviewUri(uri);
    setIsScanning(true);
    setScanHint('Odczyt kodu ze zdjęcia…');

    try {
      const result = await scanBarcodeFromImage(householdId, { uri, fileName, mimeType });
      scanLockRef.current = true;
      setProduct(result);
      setScanHint(`Znaleziono kod: ${result.barcode}`);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się odczytać kodu ze zdjęcia'));
      scanLockRef.current = false;
      setScanHint('Spróbuj ponownie innym zdjęciem');
    } finally {
      setIsScanning(false);
    }
  };

  const onPickFromGallery = async () => {
    setError(null);
    setIsScanning(true);
    try {
      const picked = await pickIngredientImageFromLibrary();
      if (!picked) {
        setIsScanning(false);
        return;
      }
      await scanCapturedImage(picked.uri, picked.fileName, picked.mimeType);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się wybrać zdjęcia'));
      setIsScanning(false);
    }
  };

  const onPickFromCameraFallback = async () => {
    setError(null);
    setIsScanning(true);
    try {
      const picked = await pickIngredientImageFromCamera();
      if (!picked) {
        setIsScanning(false);
        return;
      }
      await scanCapturedImage(picked.uri, picked.fileName, picked.mimeType);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zrobić zdjęcia'));
      setIsScanning(false);
    }
  };

  const onAddToFridge = () => {
    if (!product) {
      return;
    }

    navigation.navigate('IngredientForm', {
      householdId,
      householdName,
      prefill: {
        name: product.name ?? `Produkt ${product.barcode}`,
        barcode: product.barcode,
        notes: buildPrefillNotes(product),
      },
    });
  };

  const showLiveCamera = isNativeMobile && permission?.granted && !product;

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[styles.shell, isWideWeb && styles.shellWide]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <ScreenBackButton onPress={() => navigation.goBack()} disabled={isScanning} />

          <Text style={styles.title}>Skanuj kod kreskowy</Text>
          <Text style={styles.lead}>
            {isNativeMobile
              ? 'Na telefonie kod odczytuje się automatycznie z podglądu aparatu. Możesz też wybrać zdjęcie z galerii.'
              : 'Na webie wybierz zdjęcie kodu z pliku lub wpisz kod ręcznie.'}
          </Text>

          {showLiveCamera ? (
            <View style={styles.cameraBox}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                onBarcodeScanned={isScanning ? undefined : onBarcodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.cameraHint}>{scanHint}</Text>
              </View>
              {isScanning ? (
                <View style={styles.cameraLoading}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackText}>
                {Platform.OS === 'web'
                  ? 'Na webie wybierz zdjęcie kodu z pliku.'
                  : permission?.granted
                    ? product
                      ? 'Kod został odczytany. Możesz dodać produkt do lodówki lub zeskanować kolejny.'
                      : 'Przyznaj dostęp do aparatu, aby włączyć skanowanie na żywo.'
                    : 'Przyznaj dostęp do aparatu albo wybierz zdjęcie z galerii.'}
              </Text>
              {isNativeMobile && !permission?.granted ? (
                <Pressable
                  style={[formStyles.primaryButton, styles.actionButton, webPointer]}
                  onPress={() => void requestPermission()}
                >
                  <Text style={formStyles.primaryButtonText}>Zezwól na aparat</Text>
                </Pressable>
              ) : null}
              {product ? (
                <Pressable
                  style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
                  onPress={resetScanner}
                >
                  <Text style={formStyles.secondaryButtonText}>Skanuj kolejny kod</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} />
          ) : null}

          <View style={[styles.actions, isWideWeb && styles.actionsWide]}>
            {Platform.OS === 'web' ? (
              <Pressable
                style={[
                  formStyles.primaryButton,
                  styles.actionButton,
                  isScanning && formStyles.buttonDisabled,
                  webPointer,
                ]}
                onPress={() => void onPickFromGallery()}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={formStyles.primaryButtonText}>Wybierz zdjęcie kodu</Text>
                )}
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={[
                    formStyles.secondaryButton,
                    styles.actionButton,
                    isScanning && formStyles.buttonDisabled,
                    webPointer,
                  ]}
                  onPress={() => void onPickFromCameraFallback()}
                  disabled={isScanning}
                >
                  <Text style={formStyles.secondaryButtonText}>Zrób zdjęcie aparatem</Text>
                </Pressable>
                <Pressable
                  style={[
                    formStyles.secondaryButton,
                    styles.actionButton,
                    isScanning && formStyles.buttonDisabled,
                    webPointer,
                  ]}
                  onPress={() => void onPickFromGallery()}
                  disabled={isScanning}
                >
                  <Text style={formStyles.secondaryButtonText}>Wybierz z galerii</Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
              onPress={() => navigation.navigate('BarcodeSearch', { householdId, householdName })}
            >
              <Text style={formStyles.secondaryButtonText}>Wpisz kod ręcznie</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {product ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Znaleziono produkt</Text>
              <Text style={styles.productName}>{product.name ?? 'Bez nazwy'}</Text>
              <Text style={styles.productMeta}>Kod: {product.barcode}</Text>
              {product.brand ? <Text style={styles.productMeta}>Marka: {product.brand}</Text> : null}

              <View style={styles.resultActions}>
                <Pressable
                  style={[formStyles.primaryButton, styles.resultActionButton, webPointer]}
                  onPress={onAddToFridge}
                >
                  <Text style={formStyles.primaryButtonText}>Dodaj do lodówki</Text>
                </Pressable>
                {isNativeMobile ? (
                  <Pressable
                    style={[formStyles.secondaryButton, styles.resultActionButton, webPointer]}
                    onPress={resetScanner}
                  >
                    <Text style={formStyles.secondaryButtonText}>Skanuj kolejny</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
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
  backLink: {
    marginBottom: 16,
    alignSelf: 'flex-start',
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
    width: '78%',
    height: 120,
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
  cameraLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    gap: 10,
    marginBottom: 8,
  },
  actionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  resultBox: {
    marginTop: 12,
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  productMeta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  resultActions: {
    marginTop: 8,
    gap: 10,
  },
  resultActionButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

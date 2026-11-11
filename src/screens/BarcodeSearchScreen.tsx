import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  lookupIngredientByBarcode,
  isValidBarcode,
  normalizeBarcodeInput,
  BarcodeProduct,
} from '../api/ingredientBarcode';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { FormField } from '../components/FormField';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'BarcodeSearch'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function buildPrefillNotes(
  product: BarcodeProduct,
  t: (key: string, values?: Record<string, string | number>) => string,
): string | null {
  const parts = [product.brand, product.quantity, product.categories].filter(Boolean);
  if (parts.length === 0) {
    return t('barcode.prefillCodeOnly', { barcode: product.barcode });
  }
  return `${parts.join(' · ')}${t('barcode.prefillCodeSuffix', { barcode: product.barcode })}`;
}

export function BarcodeSearchScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { householdId, householdName } = route.params;
  const { isWideWeb } = useResponsiveLayout();

  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async () => {
    setError(null);
    setProduct(null);

    const normalized = normalizeBarcodeInput(barcode);
    if (!isValidBarcode(normalized)) {
      setError(t('barcode.searchInvalid'));
      return;
    }

    setIsSearching(true);
    try {
      const result = await lookupIngredientByBarcode(householdId, normalized);
      setProduct(result);
      setBarcode(result.barcode);
    } catch (err) {
      setError(errorMessage(err, t('barcode.searchFailed')));
    } finally {
      setIsSearching(false);
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
        name: product.name ?? t('barcode.productFallback', { barcode: product.barcode }),
        barcode: product.barcode,
        notes: buildPrefillNotes(product, t),
      },
    });
  };

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[styles.shell, isWideWeb && styles.shellWide]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <ScreenBackButton onPress={() => navigation.goBack()} disabled={isSearching} />

          <Text style={styles.title}>{t('barcode.searchTitle')}</Text>
          <Text style={styles.lead}>{t('barcode.searchLead')}</Text>

          <View style={[styles.searchPanel, isWideWeb && styles.searchPanelWide]}>
            <FormField label={t('barcode.searchFieldLabel')} hint={t('barcode.searchFieldHint')}>
              <FormTextInput
                placeholder={t('ingredient.barcodePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={barcode}
                onChangeText={setBarcode}
                editable={!isSearching}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>

            <Pressable
              style={[
                formStyles.primaryButton,
                styles.searchButton,
                isSearching && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => void onSearch()}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={formStyles.primaryButtonText}>{t('barcode.searchButton')}</Text>
              )}
            </Pressable>

            <Pressable
              style={[formStyles.secondaryButton, styles.searchButton, webPointer]}
              onPress={() => navigation.navigate('BarcodeScan', { householdId, householdName })}
            >
              <Text style={formStyles.secondaryButtonText}>{t('barcode.scanByImage')}</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {product ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{t('barcode.found')}</Text>
              <View style={[styles.resultContent, isWideWeb && styles.resultContentWide]}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productImagePlaceholderText}>{t('barcode.noPhoto')}</Text>
                  </View>
                )}

                <View style={styles.resultTextCol}>
                  <Text style={styles.productName}>{product.name ?? t('barcode.noName')}</Text>
                  {product.brand ? (
                    <Text style={styles.productMeta}>{t('barcode.brand', { brand: product.brand })}</Text>
                  ) : null}
                  {product.quantity ? (
                    <Text style={styles.productMeta}>
                      {t('barcode.packaging', { quantity: product.quantity })}
                    </Text>
                  ) : null}
                  <Text style={styles.productMeta}>
                    {t('barcode.code', { barcode: product.barcode })}
                  </Text>
                  {product.categories ? (
                    <Text style={styles.productCategories} numberOfLines={3}>
                      {product.categories}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                style={[formStyles.primaryButton, styles.addButton, webPointer]}
                onPress={onAddToFridge}
              >
                <Text style={formStyles.primaryButtonText}>{t('barcode.addToFridge')}</Text>
              </Pressable>
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
  searchPanel: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 8,
    gap: 12,
  },
  searchPanelWide: {
    padding: 24,
  },
  searchButton: {
    width: '100%',
  },
  resultBox: {
    marginTop: 12,
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultContent: {
    gap: 12,
  },
  resultContentWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  productImagePlaceholderText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resultTextCol: {
    flex: 1,
    gap: 4,
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
  productCategories: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  addButton: {
    width: '100%',
  },
});

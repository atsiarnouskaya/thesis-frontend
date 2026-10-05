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
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'BarcodeSearch'>;

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

export function BarcodeSearchScreen({ navigation, route }: Props) {
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
      setError('Podaj kod kreskowy (8–14 cyfr)');
      return;
    }

    setIsSearching(true);
    try {
      const result = await lookupIngredientByBarcode(householdId, normalized);
      setProduct(result);
      setBarcode(result.barcode);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się wyszukać produktu'));
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
        name: product.name ?? `Produkt ${product.barcode}`,
        barcode: product.barcode,
        notes: buildPrefillNotes(product),
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

          <Text style={styles.title}>Wyszukaj po kodzie kreskowym</Text>
          <Text style={styles.lead}>
            Wpisz kod ręcznie, gdy nie możesz zeskanować zdjęcia. Wyszukiwanie produktu odbywa się przez backend.
          </Text>

          <View style={[styles.searchPanel, isWideWeb && styles.searchPanelWide]}>
            <FormField label="Kod kreskowy" hint="EAN-8, EAN-13 lub inny kod numeryczny z opakowania">
              <FormTextInput
                placeholder="np. 5901234123457"
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
                <Text style={formStyles.primaryButtonText}>Szukaj produktu</Text>
              )}
            </Pressable>

            <Pressable
              style={[formStyles.secondaryButton, styles.searchButton, webPointer]}
              onPress={() => navigation.navigate('BarcodeScan', { householdId, householdName })}
            >
              <Text style={formStyles.secondaryButtonText}>Skanuj zdjęciem</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {product ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Znaleziono produkt</Text>
              <View style={[styles.resultContent, isWideWeb && styles.resultContentWide]}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productImagePlaceholderText}>Brak zdjęcia</Text>
                  </View>
                )}

                <View style={styles.resultTextCol}>
                  <Text style={styles.productName}>{product.name ?? 'Bez nazwy'}</Text>
                  {product.brand ? <Text style={styles.productMeta}>Marka: {product.brand}</Text> : null}
                  {product.quantity ? (
                    <Text style={styles.productMeta}>Opakowanie: {product.quantity}</Text>
                  ) : null}
                  <Text style={styles.productMeta}>Kod: {product.barcode}</Text>
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
                <Text style={formStyles.primaryButtonText}>Dodaj do lodówki</Text>
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
  backLink: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  lead: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  searchPanel: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  searchPanelWide: {
    padding: 24,
  },
  searchButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minWidth: 200,
  },
  resultBox: {
    marginTop: 8,
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    gap: 16,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultContent: {
    gap: 16,
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
    minWidth: 0,
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
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  addButton: {
    alignSelf: 'flex-start',
    minWidth: 220,
  },
});

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReceiptProductRow, saveReceiptProductMappings } from '../api/receipt';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { FormField } from '../components/FormField';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { HouseholdStackParamList } from '../navigation/types';
import { buildIngredientNamesFromReceipt } from '../receipt/receiptFormat';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'ReceiptProducts'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function cloneRows(items: ReceiptProductRow[]): ReceiptProductRow[] {
  return items.map((item) => ({
    productNameFromReceipt: item.productNameFromReceipt,
    userProvidedProductName: item.userProvidedProductName,
  }));
}

export function ReceiptProductsScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { householdId, householdName, items: initialItems } = route.params;
  const { isWideWeb } = useResponsiveLayout();
  const [rows, setRows] = useState<ReceiptProductRow[]>(() => cloneRows(initialItems));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productCountLabel = useMemo(() => {
    const count = rows.length;
    if (count === 1) {
      return t('receipt.productsCountOne');
    }
    return t('receipt.productsCountMany', { count });
  }, [rows.length, t]);

  const updateUserName = (index: number, value: string) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, userProvidedProductName: value } : row,
      ),
    );
  };

  const onSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const saved = await saveReceiptProductMappings(householdId, { items: rows });
      const ingredientNames = buildIngredientNamesFromReceipt(saved.items);

      if (ingredientNames.length === 0) {
        setError(t('receipt.noProductsToAdd'));
        return;
      }

      const [firstName, ...rest] = ingredientNames;
      navigation.replace('IngredientForm', {
        householdId,
        householdName,
        prefill: { name: firstName },
        receiptProductQueue: rest.length > 0 ? rest : undefined,
        receiptProductQueueTotal: ingredientNames.length,
        receiptProductQueuePosition: 1,
      });
    } catch (err) {
      setError(errorMessage(err, t('receipt.saveMappingFailed')));
    } finally {
      setIsSaving(false);
    }
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
          <ScreenBackButton onPress={() => navigation.goBack()} disabled={isSaving} />

          <Text style={styles.title}>{t('receipt.productsTitle')}</Text>
          <Text style={styles.lead}>{t('receipt.productsLead', { count: productCountLabel })}</Text>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {rows.map((row, index) => (
              <View key={`${row.productNameFromReceipt}-${index}`} style={styles.rowCard}>
                <Text style={styles.rowIndex}>
                  {t('receipt.rowLabel', { index: index + 1 })}
                </Text>

                <FormField label={t('receipt.nameFromReceipt')}>
                  <FormTextInput
                    value={row.productNameFromReceipt}
                    editable={false}
                    style={styles.disabledInput}
                  />
                </FormField>

                <FormField label={t('receipt.yourName')} hint={t('receipt.yourNameHint')}>
                  <FormTextInput
                    placeholder={t('receipt.yourNamePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={row.userProvidedProductName}
                    onChangeText={(value) => updateUserName(index, value)}
                    editable={!isSaving}
                    autoCapitalize="sentences"
                  />
                </FormField>
              </View>
            ))}
          </ScrollView>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          <View style={[styles.actions, isWideWeb && styles.actionsWide]}>
            <Pressable
              style={[
                formStyles.secondaryButton,
                styles.actionButton,
                isWideWeb && styles.actionButtonWide,
                isSaving && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
            >
              <Text style={formStyles.secondaryButtonText}>{t('common.goBack')}</Text>
            </Pressable>

            <Pressable
              style={[
                formStyles.primaryButton,
                styles.actionButton,
                isWideWeb && styles.actionButtonWide,
                isSaving && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => void onSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={formStyles.primaryButtonText}>{t('receipt.saveAndAdd')}</Text>
              )}
            </Pressable>
          </View>
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
  listScroll: {
    maxHeight: 520,
    marginBottom: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  rowCard: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  rowIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disabledInput: {
    opacity: 0.85,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  actionsWide: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
  },
  actionButtonWide: {
    width: 'auto',
    minWidth: 200,
    paddingHorizontal: 24,
  },
});

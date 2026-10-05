import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ApiError } from '../api/client';
import {
  acceptGeneratedShoppingList,
  createShoppingList,
  generateShoppingListWithLogisticRegression,
  updateShoppingList,
} from '../api/shoppingList';
import { AppChrome } from '../components/AppChrome';
import { AppPageFrame } from '../components/AppPageFrame';
import { FormField } from '../components/FormField';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import {
  parseShoppingListQuantity,
  ShoppingListItemDraft,
  validateShoppingListInput,
} from '../shoppingList/shoppingListFormat';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'ShoppingListForm'>
  | NativeStackScreenProps<AppStackParamList, 'ShoppingListForm'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ShoppingListFormScreen({ navigation, route }: Props) {
  const {
    householdId,
    householdName,
    shoppingList,
    logisticRegressionGeneration,
    mlDraft,
  } = route.params;
  const isMlReview = mlDraft != null;
  const isMlGeneration = logisticRegressionGeneration === true;
  const isEditing = shoppingList != null && !isMlGeneration;
  const appNavigation = navigation as NativeStackNavigationProp<AppStackParamList>;
  const { isWideWeb } = useResponsiveLayout();
  const nextItemId = useRef((shoppingList?.items.length ?? 1) + 1);
  const [name, setName] = useState(shoppingList?.shoppingListName ?? '');
  const [description, setDescription] = useState(
    shoppingList?.shoppingListDescription ?? '',
  );
  const [items, setItems] = useState<ShoppingListItemDraft[]>(() => {
    if (shoppingList) {
      return shoppingList.items.map((item, index) => ({
        id: String(index + 1),
        name: item.name,
        quantity: String(item.quantity),
        checked: item.checked,
      }));
    }
    if (logisticRegressionGeneration) {
      return [];
    }
    return [{ id: '1', name: '', quantity: '1', checked: false }];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mlSuccessMessage, setMlSuccessMessage] = useState<string | null>(null);

  const screenTitle = isMlReview
    ? 'Dostosuj listę z modelu ML'
    : isMlGeneration
      ? 'Nowa lista (model ML)'
      : isEditing
        ? 'Edytuj listę zakupów'
        : 'Nowa lista zakupów';

  const screenLead = isMlReview
    ? `Model zaproponował produkty dla „${householdName}”. Usuń, dodaj lub zmień pozycje - po zapisie model regresji logistycznej uczy się na Twoich wyborach.`
    : isMlGeneration
      ? `Podaj nazwę listy - produkty zostaną dobrane regresją logistyczną na podstawie produktów w lodówce „${householdName}”.`
      : isEditing
        ? `Zaktualizuj produkty dla lodówki „${householdName}”.`
        : `Dodaj produkty potrzebne dla lodówki „${householdName}”.`;

  const addItem = () => {
    const id = String(nextItemId.current);
    nextItemId.current += 1;
    setItems((current) => [
      ...current,
      { id, name: '', quantity: '1', checked: false },
    ]);
  };

  const updateItem = (
    id: string,
    field: 'name' | 'quantity',
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const onSubmit = async () => {
    setError(null);
    setMlSuccessMessage(null);
    const validationError = validateShoppingListInput(name, items, {
      requireItems: !isMlGeneration,
      validateItemFields: !isMlGeneration,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const normalizedItems = items.map((item) => ({
        name: item.name.trim(),
        quantity: parseShoppingListQuantity(item.quantity) as number,
        checked: item.checked,
      }));

      if (isMlGeneration) {
        const generated = await generateShoppingListWithLogisticRegression(householdId, {
          shoppingListName: name,
          shoppingListDescription: description.trim() || null,
        });
        const draftId = generated.draftId;
        if (!draftId) {
          setError(
            'Serwer nie zwrócił draftId - nie można przejść do edycji i uczenia modelu.',
          );
          return;
        }
        navigation.replace('ShoppingListForm', {
          householdId,
          householdName,
          shoppingList: generated,
          mlDraft: {
            draftId,
            shoppingListId: generated.shoppingListId,
          },
        });
        return;
      }

      if (isMlReview && mlDraft) {
        const draftId = mlDraft.draftId || shoppingList?.draftId;
        if (!draftId) {
          setError('Brak draftId - nie można wysłać danych do uczenia modelu.');
          return;
        }
        await acceptGeneratedShoppingList(householdId, {
          draftId,
          shoppingListId: mlDraft.shoppingListId,
          ingredientRowForRegressionList: normalizedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })),
        });
        const message =
          'Lista została zapisana. Model regresji logistycznej został zaktualizowany na podstawie Twoich wyborów.';
        if (Platform.OS === 'web') {
          setMlSuccessMessage(message);
          setTimeout(() => {
            appNavigation.navigate('ShoppingListDetail', {
              householdId,
              householdName,
              shoppingListId: mlDraft.shoppingListId,
              modelTrainedNotice: true,
            });
          }, 1200);
        } else {
          Alert.alert('Model zaktualizowany', message, [
            {
              text: 'OK',
              onPress: () =>
                appNavigation.navigate('ShoppingListDetail', {
                  householdId,
                  householdName,
                  shoppingListId: mlDraft.shoppingListId,
                  modelTrainedNotice: true,
                }),
            },
          ]);
        }
        return;
      }

      const input = {
        shoppingListName: name,
        shoppingListDescription: description.trim() || null,
        items: normalizedItems,
      };

      if (shoppingList) {
        await updateShoppingList(
          householdId,
          shoppingList.shoppingListId,
          input,
        );
      } else {
        await createShoppingList(householdId, input);
      }
      navigation.goBack();
    } catch (err) {
      setError(
        errorMessage(
          err,
          isMlReview
            ? 'Nie udało się zapisać listy i wysłać danych do modelu'
            : isMlGeneration
              ? 'Nie udało się wygenerować listy modelem ML'
              : isEditing
                ? 'Nie udało się zaktualizować listy zakupów'
                : 'Nie udało się utworzyć listy zakupów',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitLabel = isMlReview
    ? 'Zapisz i ucz model'
    : isMlGeneration
      ? 'Generuj modelem ML'
      : isEditing
        ? 'Zapisz zmiany'
        : 'Utwórz listę';

  const showItemsSection = !isMlGeneration;
  const showItemCheckboxes = isEditing && !isMlReview;

  return (
    <AppChrome navigation={appNavigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={isWideWeb ? [styles.shell, styles.shellWide] : styles.shell}
      >
        <AppPageFrame>
          <ScreenBackButton
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          />

          <View style={[styles.header, isWideWeb && styles.headerWide]}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{screenTitle}</Text>
              <Text style={styles.lead}>{screenLead}</Text>
            </View>
            <View style={styles.householdBadge}>
              <Text style={styles.householdBadgeLabel}>Lodówka</Text>
              <Text style={styles.householdBadgeName}>{householdName}</Text>
            </View>
          </View>

          <View style={styles.formPanel}>
            <FormField label="Nazwa listy">
              <FormTextInput
                value={name}
                onChangeText={setName}
                placeholder="np. Zakupy na weekend"
                editable={!isSaving && !isMlReview}
                autoCapitalize="sentences"
              />
            </FormField>

            <FormField label="Opis (opcjonalnie)">
              <FormTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Dodatkowe informacje…"
                editable={!isSaving && !isMlReview}
                multiline
                numberOfLines={3}
                style={styles.descriptionInput}
              />
            </FormField>

            {isMlReview ? (
              <View style={styles.mlBanner}>
                <Text style={styles.mlBannerText}>
                  Pozycje oznaczone przez model możesz edytować jak zwykłą listę. Zapis
                  wyśle poprawki do serwera i zaktualizuje wagi regresji logistycznej.
                </Text>
              </View>
            ) : null}

            {showItemsSection ? (
              <>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Pozycje</Text>
              <Pressable
                style={[formStyles.secondaryButton, styles.addItemButton, webPointer]}
                onPress={addItem}
                disabled={isSaving}
              >
                <Text style={formStyles.secondaryButtonText}>+ Dodaj pozycję</Text>
              </Pressable>
            </View>

            <View style={styles.items}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, isWideWeb && styles.itemRowWide]}
                >
                  <Text style={styles.itemNumber}>{index + 1}.</Text>
                  {showItemCheckboxes ? (
                    <Pressable
                      style={[styles.checkButton, item.checked && styles.checkButtonActive, webPointer]}
                      onPress={() => toggleItem(item.id)}
                      disabled={isSaving}
                      accessibilityLabel={
                        item.checked ? 'Oznacz jako niezrealizowane' : 'Oznacz jako zrealizowane'
                      }
                    >
                      <Text
                        style={[
                          styles.checkButtonText,
                          item.checked && styles.checkButtonTextActive,
                        ]}
                      >
                        {item.checked ? '✓' : ''}
                      </Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.itemName}>
                    <FormTextInput
                      value={item.name}
                      onChangeText={(value) => updateItem(item.id, 'name', value)}
                      placeholder="Nazwa produktu"
                      editable={!isSaving}
                    />
                  </View>
                  <View style={styles.itemQuantity}>
                    <FormTextInput
                      value={item.quantity}
                      onChangeText={(value) => updateItem(item.id, 'quantity', value)}
                      placeholder="Ilość"
                      keyboardType="number-pad"
                      editable={!isSaving}
                    />
                  </View>
                  <Pressable
                    style={[styles.removeButton, webPointer]}
                    onPress={() => removeItem(item.id)}
                    disabled={isSaving}
                    accessibilityLabel={`Usuń pozycję ${index + 1}`}
                  >
                    <Text style={styles.removeButtonText}>Usuń</Text>
                  </Pressable>
                </View>
              ))}
            </View>
              </>
            ) : null}
          </View>

          {mlSuccessMessage ? (
            <Text style={styles.successMessage}>{mlSuccessMessage}</Text>
          ) : null}
          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          <View style={[styles.actions, isWideWeb && styles.actionsWide]}>
            <Pressable
              style={[
                formStyles.secondaryButton,
                styles.actionButton,
                isSaving && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
            >
              <Text style={formStyles.secondaryButtonText}>Anuluj</Text>
            </Pressable>
            <Pressable
              style={[
                formStyles.primaryButton,
                styles.actionButton,
                isSaving && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => void onSubmit()}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={formStyles.primaryButtonText}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </AppPageFrame>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', maxWidth: 760 },
  shellWide: { maxWidth: 960 },
  header: { gap: 16, marginBottom: 24 },
  headerWide: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  householdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7F4',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  householdBadgeLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  householdBadgeName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  mlBanner: {
    backgroundColor: '#E8F4EF',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  mlBannerText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  successMessage: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 12,
  },
  formPanel: {
    backgroundColor: '#FAFCFA',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  descriptionInput: {
    minHeight: Platform.OS === 'web' ? 100 : 84,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  itemsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  addItemButton: { paddingHorizontal: 14, paddingVertical: 10 },
  items: { gap: 10 },
  itemRow: {
    alignItems: 'stretch',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  itemRowWide: { alignItems: 'center', flexDirection: 'row' },
  itemNumber: { color: colors.textMuted, fontWeight: '700', minWidth: 24 },
  checkButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkButtonActive: {
    backgroundColor: colors.primary,
  },
  checkButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  checkButtonTextActive: {
    color: '#fff',
  },
  itemName: { flex: 1 },
  itemQuantity: { width: 110 },
  removeButton: { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  removeButtonText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  actions: { gap: 12, marginTop: 20 },
  actionsWide: { flexDirection: 'row-reverse', justifyContent: 'flex-start' },
  actionButton: { minWidth: 168 },
});

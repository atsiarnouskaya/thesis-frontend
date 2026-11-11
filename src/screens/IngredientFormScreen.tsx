import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  createIngredient,
  fetchIngredient,
  updateIngredient,
} from '../api/ingredient';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { DatePickerField } from '../components/DatePickerField';
import { FormField } from '../components/FormField';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import {
  todayLocalDateString,
  parseIngredientQuantityInput,
  validateIngredientInput,
} from '../ingredient/ingredientFormat';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { resetToHouseholdDetail } from '../navigation/navigationHelpers';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import {
  pickIngredientImageFromCamera,
  pickIngredientImageFromLibrary,
  PickedImage,
} from '../utils/pickIngredientImage';
import { useI18n } from '../i18n/I18nContext';
import { toDataUri } from '../utils/base64';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'IngredientForm'>
  | NativeStackScreenProps<AppStackParamList, 'IngredientForm'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function IngredientFormScreen({ navigation, route }: Props) {
  const {
    householdId,
    householdName,
    ingredientId,
    prefill,
    receiptProductQueue,
    receiptProductQueueTotal,
    receiptProductQueuePosition,
  } = route.params;
  const isEditing = Boolean(ingredientId);
  const isReceiptQueueStep = !isEditing && (receiptProductQueueTotal ?? 0) > 0;
  const { t } = useI18n();
  const { isWideWeb } = useResponsiveLayout();

  const [name, setName] = useState(prefill?.name ?? '');
  const [barcode, setBarcode] = useState(prefill?.barcode ?? '');
  const [quantity, setQuantity] = useState('');
  const [purchasedAt, setPurchasedAt] = useState(todayLocalDateString());
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState(prefill?.notes ?? '');
  const [pickedPhoto, setPickedPhoto] = useState<PickedImage | null>(null);
  const [existingPhotoBase64, setExistingPhotoBase64] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIngredient = useCallback(async () => {
    if (!ingredientId) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const ingredient = await fetchIngredient(householdId, ingredientId);
      setName(ingredient.name);
      setQuantity(ingredient.quantity != null ? String(ingredient.quantity) : '');
      setPurchasedAt(ingredient.purchasedAt);
      setExpiresAt(ingredient.expiresAt);
      setNotes(ingredient.notes ?? '');
      setExistingPhotoBase64(ingredient.ingredientPicture);
      setPickedPhoto(null);
      setPhotoRemoved(false);
      setPhotoHint(null);
    } catch (err) {
      setError(errorMessage(err, t('ingredient.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  }, [householdId, ingredientId, t]);

  useEffect(() => {
    void loadIngredient();
  }, [loadIngredient]);

  const pickPhoto = async (source: 'camera' | 'library') => {
    setError(null);
    setPhotoHint(null);
    setIsPickingPhoto(true);
    try {
      const picked =
        source === 'camera'
          ? await pickIngredientImageFromCamera()
          : await pickIngredientImageFromLibrary();
      if (picked) {
        setPickedPhoto(picked);
        setPhotoRemoved(false);
        setPhotoHint(t('ingredient.photoSavedHint'));
      }
    } catch (err) {
      setError(errorMessage(err, t('ingredient.pickPhotoFailed')));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const photoPreviewUri =
    pickedPhoto?.uri ??
    (!photoRemoved && existingPhotoBase64 ? toDataUri(existingPhotoBase64) : null);
  const hasSavedPhoto = Boolean(existingPhotoBase64) && !photoRemoved && !pickedPhoto;

  const leaveForm = () => {
    if (isEditing) {
      navigation.goBack();
      return;
    }

    resetToHouseholdDetail(navigation, { householdId });
  };

  const openNextReceiptProductForm = () => {
    if (!receiptProductQueue || receiptProductQueue.length === 0) {
      resetToHouseholdDetail(navigation, { householdId });
      return;
    }

    const [nextName, ...remaining] = receiptProductQueue;
    const nextPosition = (receiptProductQueuePosition ?? 1) + 1;

    navigation.replace('IngredientForm', {
      householdId,
      householdName,
      prefill: { name: nextName },
      receiptProductQueue: remaining.length > 0 ? remaining : undefined,
      receiptProductQueueTotal,
      receiptProductQueuePosition: nextPosition,
    });
  };

  const onSubmit = async () => {
    setError(null);

    const validationError = validateIngredientInput({ name, purchasedAt, expiresAt, quantity }, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    const parsedQuantity = parseIngredientQuantityInput(quantity);

    setIsSaving(true);
    try {
      const payload = {
        name,
        purchasedAt,
        expiresAt,
        notes: notes.trim() ? notes : null,
        quantity: parsedQuantity,
      };

      if (isEditing && ingredientId) {
        await updateIngredient(householdId, ingredientId, payload, {
          photo: pickedPhoto,
          removeImage: photoRemoved && !pickedPhoto,
        });
        navigation.goBack();
        return;
      } else {
        await createIngredient(householdId, payload, pickedPhoto);
        if (receiptProductQueue && receiptProductQueue.length > 0) {
          openNextReceiptProductForm();
          return;
        }
        resetToHouseholdDetail(navigation, { householdId });
        return;
      }
    } catch (err) {
      setError(errorMessage(err, t('ingredient.saveFailed')));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppChrome navigation={navigation} activeRoute="Households">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[styles.shell, isWideWeb && styles.shellWide]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <View style={[styles.header, isWideWeb && styles.headerWide]}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {isEditing ? t('ingredient.formEditTitle') : t('ingredient.formNewTitle')}
              </Text>
              <Text style={styles.lead}>
                {isEditing
                  ? t('ingredient.formEditLead')
                  : isReceiptQueueStep
                    ? t('ingredient.formReceiptLead', {
                        position: receiptProductQueuePosition ?? 1,
                        total: receiptProductQueueTotal ?? 0,
                      })
                    : t('ingredient.formNewLead')}
              </Text>
            </View>
            <View style={styles.householdBadge}>
              <Text style={styles.householdBadgeLabel}>{t('common.fridge')}</Text>
              <Text style={styles.householdBadgeName}>{householdName}</Text>
            </View>
          </View>

          <View style={[styles.formPanel, isWideWeb && styles.formPanelWide]}>
            <FormField label={t('ingredient.name')}>
              <FormTextInput
                placeholder={t('ingredient.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!isSaving}
                autoCapitalize="sentences"
              />
            </FormField>

            <FormField label={t('ingredient.quantity')}>
              <FormTextInput
                placeholder={t('ingredient.quantityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={setQuantity}
                editable={!isSaving}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>

            <FormField label={t('ingredient.barcode')}>
              <FormTextInput
                placeholder={t('ingredient.barcodePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={barcode}
                onChangeText={setBarcode}
                editable={!isSaving}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>

            <FormField
              label={t('ingredient.photo')}
              hint={
                photoPreviewUri
                  ? isEditing
                    ? t('ingredient.photoHintEdit')
                    : t('ingredient.photoHintNew')
                  : t('ingredient.photoHintAdd')
              }
            >
              {photoPreviewUri ? (
                <Image source={{ uri: photoPreviewUri }} style={styles.photoPreview} />
              ) : null}

              <View style={[styles.photoActions, isWideWeb && styles.photoActionsWide]}>
                <Pressable
                  style={[
                    formStyles.secondaryButton,
                    styles.photoActionButton,
                    (isSaving || isPickingPhoto) && formStyles.buttonDisabled,
                    webPointer,
                  ]}
                  onPress={() => void pickPhoto('library')}
                  disabled={isSaving || isPickingPhoto}
                >
                  <Text style={formStyles.secondaryButtonText}>
                    {photoPreviewUri ? t('ingredient.changePhoto') : t('common.gallery')}
                  </Text>
                </Pressable>

                {Platform.OS !== 'web' ? (
                  <Pressable
                    style={[
                      formStyles.secondaryButton,
                      styles.photoActionButton,
                      (isSaving || isPickingPhoto) && formStyles.buttonDisabled,
                      webPointer,
                    ]}
                    onPress={() => void pickPhoto('camera')}
                    disabled={isSaving || isPickingPhoto}
                  >
                    <Text style={formStyles.secondaryButtonText}>{t('common.camera')}</Text>
                  </Pressable>
                ) : null}

                {pickedPhoto ? (
                  <Pressable
                    style={[styles.removePhotoLink, webPointer]}
                    onPress={() => {
                      setPickedPhoto(null);
                      setPhotoHint(null);
                    }}
                    disabled={isSaving || isPickingPhoto}
                  >
                    <Text style={formStyles.link}>{t('ingredient.cancelPhotoPick')}</Text>
                  </Pressable>
                ) : null}

                {hasSavedPhoto ? (
                  <Pressable
                    style={[styles.removePhotoLink, webPointer]}
                    onPress={() => {
                      setPickedPhoto(null);
                      setPhotoRemoved(true);
                      setPhotoHint(t('ingredient.photoRemovedHint'));
                    }}
                    disabled={isSaving || isPickingPhoto}
                  >
                    <Text style={[formStyles.link, styles.removePhotoText]}>
                      {t('ingredient.removePhoto')}
                    </Text>
                  </Pressable>
                ) : null}

                {photoRemoved && existingPhotoBase64 && !pickedPhoto ? (
                  <Pressable
                    style={[styles.removePhotoLink, webPointer]}
                    onPress={() => {
                      setPhotoRemoved(false);
                      setPhotoHint(null);
                    }}
                    disabled={isSaving || isPickingPhoto}
                  >
                    <Text style={formStyles.link}>{t('ingredient.restorePhoto')}</Text>
                  </Pressable>
                ) : null}
              </View>

              {photoHint ? <Text style={styles.photoHint}>{photoHint}</Text> : null}
            </FormField>

            <View style={[styles.dateRow, isWideWeb && styles.dateRowWide]}>
              <FormField label={t('ingredient.purchasedAt')} style={styles.dateField}>
                <DatePickerField
                  value={purchasedAt}
                  onChange={setPurchasedAt}
                  editable={!isSaving}
                  placeholder={t('ingredient.purchasedAtPlaceholder')}
                />
              </FormField>

              <FormField label={t('ingredient.expiresAt')} style={styles.dateField}>
                <DatePickerField
                  value={expiresAt}
                  onChange={setExpiresAt}
                  editable={!isSaving}
                  placeholder={t('ingredient.expiresAtPlaceholder')}
                />
              </FormField>
            </View>

            <FormField label={t('ingredient.notes')} hint={t('ingredient.notesHint')}>
              <FormTextInput
                placeholder={t('ingredient.notesPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                editable={!isSaving}
                multiline
                numberOfLines={4}
                style={styles.notesInput}
              />
            </FormField>
          </View>

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
              onPress={leaveForm}
              disabled={isSaving}
            >
              <Text style={formStyles.secondaryButtonText}>{t('common.cancel')}</Text>
            </Pressable>

            <Pressable
              style={[
                formStyles.primaryButton,
                styles.actionButton,
                isWideWeb && styles.actionButtonWide,
                isSaving && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => void onSubmit()}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={formStyles.primaryButtonText}>
                  {isEditing
                    ? t('ingredient.saveChanges')
                    : isReceiptQueueStep &&
                        receiptProductQueue &&
                        receiptProductQueue.length > 0
                      ? t('ingredient.saveNext')
                      : isReceiptQueueStep
                        ? t('ingredient.saveFinish')
                        : t('ingredient.addProduct')}
                </Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  frameWide: {
    gap: 0,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  breadcrumbSep: {
    color: colors.textMuted,
  },
  breadcrumbCurrent: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  backLink: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  header: {
    gap: 16,
    marginBottom: 24,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 15,
  },
  householdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
  },
  householdBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  householdBadgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  formPanel: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 8,
  },
  formPanelWide: {
    padding: 24,
  },
  dateRow: {
    gap: 0,
  },
  dateRowWide: {
    flexDirection: 'row',
    gap: 16,
  },
  dateField: {
    flex: 1,
  },
  notesInput: {
    minHeight: Platform.OS === 'web' ? 120 : 100,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'web' ? 14 : 12
  },
  input: {

      marginBottom: Platform.OS === 'web' ? 0 : 12
  },
  photoPreview: {
    width: '100%',
    maxWidth: 320,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoActions: {
    gap: 10,
  },
  photoActionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  photoActionButton: {
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  removePhotoLink: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  removePhotoText: {
    color: colors.error,
  },
  photoHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.primaryMuted,
    fontWeight: '600',
  },
  actions: {
    marginTop: 20,
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
    minWidth: 168,
    paddingHorizontal: 24,
  },
});

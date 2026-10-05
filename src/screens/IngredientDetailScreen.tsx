import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  consumeIngredient,
  deleteIngredient,
  discardIngredient,
  fetchIngredient,
  Ingredient,
} from '../api/ingredient';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { ConfirmDialog, ConfirmDialogVariant } from '../components/ConfirmDialog';
import { IngredientStatusButtons } from '../components/IngredientStatusButtons';
import { ScreenShell } from '../components/ScreenShell';
import {
  expiryStatusLabel,
  formatIngredientQuantity,
  formatLocalDate,
  getExpiryStatus,
  shouldShowExpiryBadge,
  todayLocalDateString,
} from '../ingredient/ingredientFormat';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import { toDataUri } from '../utils/base64';

const DETAIL_PHOTO_WIDTH = 300;
const DETAIL_PANEL_WIDTH = 380;

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'IngredientDetail'>
  | NativeStackScreenProps<AppStackParamList, 'IngredientDetail'>;

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: ConfirmDialogVariant;
  onConfirm: () => Promise<void>;
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function IngredientDetailScreen({ navigation, route }: Props) {
  const {
    householdId,
    householdName,
    ingredientId,
    returnTo = 'HouseholdDetail',
    allowStatusChange = false,
    ingredientStatusFilter,
  } = route.params;
  const { isWideWeb } = useResponsiveLayout();

  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'consume' | 'discard' | 'delete' | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const openConfirm = (request: ConfirmRequest) => {
    setConfirmRequest(request);
  };

  const closeConfirm = () => {
    if (!isConfirmLoading) {
      setConfirmRequest(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmRequest) {
      return;
    }

    setIsConfirmLoading(true);
    try {
      await confirmRequest.onConfirm();
      setConfirmRequest(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const goBackToIngredients = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (returnTo === 'IngredientList') {
      navigation.navigate('IngredientList', {
        householdId,
        householdName,
        ingredientStatusFilter,
      });
      return;
    }

    navigation.navigate('HouseholdDetail', { householdId, ingredientStatusFilter });
  }, [navigation, returnTo, householdId, householdName, ingredientStatusFilter]);

  const loadIngredient = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const item = await fetchIngredient(householdId, ingredientId);
      setIngredient(item);
    } catch (err) {
      setIngredient(null);
      setError(errorMessage(err, 'Nie udało się załadować produktu'));
    } finally {
      setIsLoading(false);
    }
  }, [householdId, ingredientId]);

  useFocusEffect(
    useCallback(() => {
      void loadIngredient();
    }, [loadIngredient]),
  );

  const openEdit = () => {
    navigation.navigate('IngredientForm', {
      householdId,
      householdName,
      ingredientId,
    });
  };

  const onConsume = () => {
    if (!ingredient) {
      return;
    }

    openConfirm({
      title: 'Oznacz jako zjedzone',
      message: `Czy produkt „${ingredient.name}” został zjedzony?`,
      confirmLabel: 'Zjedzone',
      variant: 'default',
      onConfirm: async () => {
        setError(null);
        setPendingAction('consume');
        try {
          await consumeIngredient(householdId, ingredientId, todayLocalDateString());
          goBackToIngredients();
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się oznaczyć produktu jako zjedzonego'));
        } finally {
          setPendingAction(null);
        }
      },
    });
  };

  const onDiscard = () => {
    if (!ingredient) {
      return;
    }

    openConfirm({
      title: 'Oznacz jako wyrzucone',
      message: `Czy produkt „${ingredient.name}” został wyrzucony i nie został zjedzony?`,
      confirmLabel: 'Wyrzucone',
      variant: 'default',
      onConfirm: async () => {
        setError(null);
        setPendingAction('discard');
        try {
          await discardIngredient(householdId, ingredientId, todayLocalDateString());
          goBackToIngredients();
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się oznaczyć produktu jako wyrzuconego'));
        } finally {
          setPendingAction(null);
        }
      },
    });
  };

  const onDelete = () => {
    if (!ingredient) {
      return;
    }

    openConfirm({
      title: 'Usuń produkt',
      message: `Czy na pewno chcesz usunąć „${ingredient.name}”? Tej operacji nie można cofnąć.`,
      confirmLabel: 'Usuń',
      variant: 'destructive',
      onConfirm: async () => {
        setError(null);
        setPendingAction('delete');
        try {
          await deleteIngredient(householdId, ingredientId);
          goBackToIngredients();
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się usunąć produktu'));
        } finally {
          setPendingAction(null);
        }
      },
    });
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

  if (!ingredient) {
    return (
      <AppChrome navigation={navigation} activeRoute="Households" scroll>
        <ScreenShell variant="app" card={false} alignTop>
          <AppPageFrame>
            <Pressable onPress={goBackToIngredients} style={[styles.backArrow, webPointer]}>
              <Text style={styles.backArrowIcon}>←</Text>
            </Pressable>
            {error ? <Text style={formStyles.error}>{error}</Text> : null}
          </AppPageFrame>
        </ScreenShell>
      </AppChrome>
    );
  }

  const status = getExpiryStatus(ingredient.expiresAt);
  const photoUri = ingredient.ingredientPicture ? toDataUri(ingredient.ingredientPicture) : null;
  const quantityLabel = formatIngredientQuantity(ingredient.quantity) ?? '-';
  const isActionPending = pendingAction !== null || isConfirmLoading;
  const showExpiryBadge = shouldShowExpiryBadge(ingredientStatusFilter);

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[styles.shell, isWideWeb && styles.shellWide]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <View style={styles.topBar}>
            <Pressable onPress={goBackToIngredients} style={[styles.backArrow, webPointer]}>
              <Text style={styles.backArrowIcon}>←</Text>
            </Pressable>

            <View style={styles.topActions}>
              <Pressable
                style={[
                  styles.editButton,
                  isActionPending && formStyles.buttonDisabled,
                  webPointer,
                ]}
                onPress={openEdit}
                disabled={isActionPending}
              >
                <Text style={styles.editButtonText}>Edytuj</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.dangerButton,
                  isActionPending && formStyles.buttonDisabled,
                  webPointer,
                ]}
                onPress={onDelete}
                disabled={isActionPending}
              >
                {pendingAction === 'delete' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dangerButtonText}>Usuń</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={[styles.header, isWideWeb && styles.headerWide]}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{ingredient.name}</Text>
              {showExpiryBadge ? (
                <View
                  style={[
                    styles.statusBadge,
                    status === 'expired' && styles.statusExpired,
                    status === 'soon' && styles.statusSoon,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{expiryStatusLabel(status)}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.householdBadge}>
              <Text style={styles.householdBadgeLabel}>Lodówka</Text>
              <Text style={styles.householdBadgeName}>{householdName}</Text>
            </View>
          </View>

          <View style={[styles.contentRow, isWideWeb && styles.contentRowWide]}>
            {isWideWeb ? (
              <View style={styles.photoColumn}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreviewWide}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>Brak zdjęcia</Text>
                  </View>
                )}
              </View>
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : null}

            <View
              style={[
                styles.detailPanel,
                isWideWeb && styles.detailPanelWide,
                isWideWeb && styles.detailPanelColumn,
              ]}
            >
              <DetailRow label="Data zakupu" value={formatLocalDate(ingredient.purchasedAt)} />
              <DetailRow label="Termin ważności" value={formatLocalDate(ingredient.expiresAt)} />
              <DetailRow label="Ilość" value={quantityLabel} />
              {ingredient.notes ? (
                <View style={styles.notesBlock}>
                  <Text style={styles.detailLabel}>Uwagi</Text>
                  <Text style={styles.notesValue}>{ingredient.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {allowStatusChange ? (
            <View style={styles.statusSection}>
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerTitle}>Co oznacza „Wyrzucone”?</Text>
                <Text style={styles.infoBannerText}>
                  Oznacza, że produkt nie został zjedzony. Ta informacja będzie wykorzystywana przy
                  obliczaniu statystyk i generowaniu listy zakupów.
                </Text>
              </View>

              <IngredientStatusButtons
                layout="row"
                plain
                onConsume={onConsume}
                onDiscard={onDiscard}
                isConsumePending={pendingAction === 'consume'}
                isDiscardPending={pendingAction === 'discard'}
                disabled={isActionPending}
              />
            </View>
          ) : null}
        </AppPageFrame>
      </ScreenShell>

      <ConfirmDialog
        visible={confirmRequest !== null}
        title={confirmRequest?.title ?? ''}
        message={confirmRequest?.message ?? ''}
        confirmLabel={confirmRequest?.confirmLabel}
        variant={confirmRequest?.variant}
        isLoading={isConfirmLoading}
        onConfirm={() => void handleConfirm()}
        onCancel={closeConfirm}
      />
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
  backArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusSoon: {
    backgroundColor: '#FFF4E5',
  },
  statusExpired: {
    backgroundColor: colors.dangerBg,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  photoPreview: {
    width: '100%',
    maxWidth: 420,
    height: 260,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
  },
  contentRow: {
    gap: 0,
  },
  contentRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 24,
    marginBottom: 8,
    width: DETAIL_PHOTO_WIDTH + 24 + DETAIL_PANEL_WIDTH,
    maxWidth: '100%',
  },
  photoColumn: {
    width: DETAIL_PHOTO_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
  },
  photoPreviewWide: {
    width: DETAIL_PHOTO_WIDTH,
    height: DETAIL_PHOTO_WIDTH,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPlaceholder: {
    width: DETAIL_PHOTO_WIDTH,
    height: DETAIL_PHOTO_WIDTH,
    borderRadius: 14,
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  photoPlaceholderText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  detailPanel: {
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    gap: 16,
    marginBottom: 8,
  },
  detailPanelWide: {
    padding: 24,
  },
  detailPanelColumn: {
    width: DETAIL_PANEL_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 0,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  notesBlock: {
    gap: 6,
  },
  notesValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  statusSection: {
    marginTop: 20,
    gap: 12,
  },
  infoBanner: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A4D8F',
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#2C5282',
  },
  dangerButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

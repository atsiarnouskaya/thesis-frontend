import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  createHousehold,
  fetchMyHouseholds,
  fetchMyPendingJoinRequests,
  Household,
  JoinRequest,
  requestJoinHousehold,
} from '../api/household';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import { formatInstant, roleLabel } from '../household/householdFormat';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'HouseholdList'>
  | NativeStackScreenProps<AppStackParamList, 'Households'>;

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function HouseholdListScreen({ navigation, route }: Props) {
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  const loadHouseholds = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [list, pending] = await Promise.all([
        fetchMyHouseholds(),
        fetchMyPendingJoinRequests(),
      ]);
      setHouseholds(list);
      setPendingJoinRequests(pending);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się pobrać lodówek'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHouseholds();
    }, [loadHouseholds]),
  );

  const onCreate = async () => {
    setError(null);
    setSuccess(null);
    if (!createName.trim()) {
      setError('Podaj nazwę lodówki');
      return;
    }

    setBusy('create');
    try {
      const created = await createHousehold(createName, createDescription);
      setCreateName('');
      setCreateDescription('');
      setSuccess(
        `Utworzono „${created.name}”. Kod: ${created.invitationWithQr.code}`,
      );
      await loadHouseholds();
      navigation.navigate('HouseholdDetail', { householdId: created.id });
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się utworzyć lodówki'));
    } finally {
      setBusy(null);
    }
  };

  const processedInviteRef = useRef<string | null>(null);

  const runJoin = useCallback(
    async (code: string) => {
      setError(null);
      setSuccess(null);
      const normalized = code.trim();
      if (!normalized) {
        setError('Podaj kod zaproszenia');
        return;
      }

      setBusy('join');
      try {
        const request = await requestJoinHousehold(normalized);
        setJoinCode('');
        setSuccess(
          `Wysłano prośbę o dołączenie do „${request.householdName}”. Właściciel musi ją zaakceptować.`,
        );
        await loadHouseholds();
        navigation.setParams({ inviteCode: undefined });
      } catch (err) {
        setError(errorMessage(err, 'Nie udało się dołączyć do lodówki'));
      } finally {
        setBusy(null);
      }
    },
    [loadHouseholds, navigation],
  );

  const onJoin = async () => {
    await runJoin(joinCode);
  };

  useEffect(() => {
    const paramCode = route.params?.inviteCode;
    if (!paramCode) {
      return;
    }
    if (processedInviteRef.current === paramCode) {
      return;
    }
    processedInviteRef.current = paramCode;
    setJoinCode(paramCode);
    void runJoin(paramCode);
  }, [route.params?.inviteCode, runJoin]);

  const page = (
    <>
      <Text style={[styles.pageTitle, !isNativeMobile && styles.pageTitleWeb]}>Lodówki</Text>
      <Text style={styles.subtitle}>
        Wspólne gospodarstwa domowe - utwórz własną lodówkę lub wyślij prośbę o dołączenie kodem od
        właściciela.
      </Text>

      <View style={[styles.actionsRow, isWideWeb && styles.actionsRowWide]}>
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Nowa lodówka</Text>
          <FormTextInput
            placeholder="np. Dom, Wspólnota"
            placeholderTextColor={colors.textMuted}
            value={createName}
            onChangeText={setCreateName}
            editable={busy === null}
          />
          <FormTextInput
            placeholder="Opis (opcjonalnie)"
            placeholderTextColor={colors.textMuted}
            value={createDescription}
            onChangeText={setCreateDescription}
            editable={busy === null}
            multiline
            numberOfLines={2}
            style={styles.createDescriptionInput}
          />
          <Pressable
            style={[
              formStyles.primaryButton,
              busy === 'create' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onCreate}
            disabled={busy !== null}
          >
            {busy === 'create' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.primaryButtonText}>Utwórz</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Dołącz kodem</Text>
          <FormTextInput
            placeholder="Kod 8 znaków"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={joinCode}
            onChangeText={setJoinCode}
            editable={busy === null}
          />
          <Pressable
            style={[
              formStyles.secondaryButton,
              busy === 'join' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onJoin}
            disabled={busy !== null}
          >
            {busy === 'join' ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={formStyles.secondaryButtonText}>Wyślij prośbę</Text>
            )}
          </Pressable>
        </View>
      </View>

      {success ? <Text style={formStyles.success}>{success}</Text> : null}
      {error ? <Text style={formStyles.error}>{error}</Text> : null}

      {pendingJoinRequests.length > 0 ? (
        <>
          <Text style={styles.listHeading}>Oczekujące prośby</Text>
          <View style={styles.pendingList}>
            {pendingJoinRequests.map((request) => (
              <View key={request.id} style={styles.pendingItem}>
                <Text style={styles.pendingTitle}>{request.householdName}</Text>
                <Text style={styles.pendingMeta}>
                  Wysłano {formatInstant(request.requestedAt)} · czeka na akceptację właściciela
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.listHeading}>Twoje lodówki</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : households.length === 0 ? (
        <Text style={styles.empty}>Nie należysz jeszcze do żadnej lodówki.</Text>
      ) : (
        <View style={styles.list}>
          {households.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.listItem, webPointer]}
              onPress={() => navigation.navigate('HouseholdDetail', { householdId: item.id })}
            >
              <View style={styles.listItemMain}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemMeta}>
                  {roleLabel(item.myRole)} · od {formatInstant(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.listItemChevron}>→</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      {isNativeMobile ? (
        <View style={[styles.page, { paddingTop: pagePaddingTop }]}>{page}</View>
      ) : (
        <ScreenShell variant="app" card={false} alignTop contentStyle={styles.shell}>
          {page}
        </ScreenShell>
      )}
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 880,
  },
  page: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  pageTitleWeb: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actionsRow: {
    gap: 16,
    marginBottom: 20,
  },
  actionsRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.surface,
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  createDescriptionInput: {
    marginTop: 10,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  list: {
    gap: 10,
  },
  pendingList: {
    gap: 10,
    marginBottom: 20,
  },
  pendingItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  pendingMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.surface,
  },
  listItemMain: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  listItemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  listItemChevron: {
    fontSize: 20,
    color: colors.primaryMuted,
    marginLeft: 12,
  },
});

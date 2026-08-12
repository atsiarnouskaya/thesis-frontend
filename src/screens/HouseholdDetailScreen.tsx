import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  acceptJoinRequest,
  fetchHousehold,
  fetchHouseholdMembers,
  fetchPendingJoinRequests,
  Household,
  HouseholdMember,
  JoinRequest,
  mergeInvitation,
  regenerateHouseholdInvitation,
  rejectJoinRequest,
} from '../api/household';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { HouseholdJoinQr } from '../components/HouseholdJoinQr';
import { ScreenShell } from '../components/ScreenShell';
import {
  formatInstant,
  invitationExpiryLabel,
  isInvitationExpired,
  roleLabel,
} from '../household/householdFormat';
import { buildHouseholdJoinUrl } from '../household/joinLink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import { copyTextToClipboard } from '../utils/clipboard';

type Props = NativeStackScreenProps<AppStackParamList, 'HouseholdDetail'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function HouseholdDetailScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { isWideWeb } = useResponsiveLayout();

  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);

  const invitation = household?.invitationWithQr;
  const expired = isInvitationExpired(invitation?.expiresAt);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const h = await fetchHousehold(householdId);
      const m = await fetchHouseholdMembers(householdId);
      let pending: JoinRequest[] = [];
      if (h.myRole === 'OWNER') {
        pending = await fetchPendingJoinRequests(householdId);
      }
      setHousehold(h);
      setMembers(m);
      setPendingJoinRequests(pending);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się załadować lodówki'));
      setHousehold(null);
      setMembers([]);
      setPendingJoinRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onCopyInvite = async () => {
    if (!invitation?.code) {
      return;
    }
    try {
      await copyTextToClipboard(buildHouseholdJoinUrl(invitation.code));
      setCopyHint('Link do dołączenia skopiowany / udostępniony.');
    } catch (err) {
      setCopyHint(err instanceof Error ? err.message : 'Nie udało się skopiować linku');
    }
  };

  const onRegenerateInvite = async () => {
    if (!household || household.myRole !== 'OWNER') {
      return;
    }

    setError(null);
    setCopyHint(null);
    setRegenerating(true);
    try {
      const nextInvitation = await regenerateHouseholdInvitation(household.id);
      setHousehold(mergeInvitation(household, nextInvitation));
      setCopyHint('Wygenerowano nowy kod zaproszenia.');
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się wygenerować nowego kodu'));
    } finally {
      setRegenerating(false);
    }
  };

  const onAcceptJoinRequest = async (requestId: string) => {
    setError(null);
    setCopyHint(null);
    setActingRequestId(requestId);
    try {
      const updated = await acceptJoinRequest(requestId);
      setHousehold(updated);
      setCopyHint('Zaakceptowano prośbę o dołączenie.');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zaakceptować prośby'));
    } finally {
      setActingRequestId(null);
    }
  };

  const onRejectJoinRequest = async (requestId: string) => {
    setError(null);
    setCopyHint(null);
    setActingRequestId(requestId);
    try {
      await rejectJoinRequest(requestId);
      setPendingJoinRequests((current) => current.filter((item) => item.id !== requestId));
      setCopyHint('Odrzucono prośbę o dołączenie.');
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się odrzucić prośby'));
    } finally {
      setActingRequestId(null);
    }
  };

  if (isLoading && !household) {
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
      <ScreenShell variant="app" card={false} alignTop contentStyle={styles.shell}>
        <View style={styles.card}>
          {!isWideWeb ? (
            <Pressable
              onPress={() => navigation.navigate('Households')}
              style={[styles.backLink, webPointer]}
            >
              <Text style={formStyles.link}>← Wszystkie lodówki</Text>
            </Pressable>
          ) : null}

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {household && invitation ? (
            <>
              <Text style={styles.title}>{household.name}</Text>
              <Text style={styles.meta}>
                Twoja rola: {roleLabel(household.myRole)} · utworzono{' '}
                {formatInstant(household.createdAt)}
              </Text>

              <View style={[styles.inviteBox, expired && styles.inviteBoxExpired]}>
                <Text style={styles.inviteLabel}>Zaproszenie</Text>

                <View style={[styles.inviteContent, isWideWeb && styles.inviteContentWide]}>
                  <HouseholdJoinQr inviteCode={invitation.code} size={200} />

                  <View style={styles.inviteTextCol}>
                    <Text style={styles.inviteCode}>{invitation.code}</Text>
                    <Text style={[styles.expiryText, expired && styles.expiryExpired]}>
                      {invitationExpiryLabel(invitation.expiresAt)}
                    </Text>
                    <Text style={styles.inviteHint}>
                      Zeskanuj QR — otworzy się strona dołączenia w aplikacji. Po zalogowaniu użytkownik
                      wyśle prośbę o dołączenie; Ty jako właściciel musisz ją zaakceptować.
                    </Text>
                  </View>
                </View>

                <View style={styles.inviteActions}>
                  <Pressable
                    style={[formStyles.secondaryButton, styles.inviteActionBtn, webPointer]}
                    onPress={() => void onCopyInvite()}
                  >
                    <Text style={formStyles.secondaryButtonText}>Kopiuj link dołączenia</Text>
                  </Pressable>

                  {household.myRole === 'OWNER' ? (
                    <Pressable
                      style={[
                        formStyles.primaryButton,
                        styles.inviteActionBtn,
                        regenerating && formStyles.buttonDisabled,
                        webPointer,
                      ]}
                      onPress={() => void onRegenerateInvite()}
                      disabled={regenerating}
                    >
                      {regenerating ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={formStyles.primaryButtonText}>Nowy kod i QR</Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>

                {copyHint ? <Text style={styles.copyHint}>{copyHint}</Text> : null}
              </View>

              {household.myRole === 'OWNER' && pendingJoinRequests.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>
                    Prośby o dołączenie ({pendingJoinRequests.length})
                  </Text>
                  <View style={styles.pendingRequestsList}>
                    {pendingJoinRequests.map((request) => (
                      <View key={request.id} style={styles.pendingRequestRow}>
                        <View style={styles.memberMain}>
                          <Text style={styles.memberName}>{request.displayName}</Text>
                          <Text style={styles.memberEmail}>{request.email}</Text>
                          <Text style={styles.pendingRequestMeta}>
                            {formatInstant(request.requestedAt)}
                          </Text>
                        </View>
                        <View style={styles.pendingRequestActions}>
                          <Pressable
                            style={[
                              formStyles.primaryButton,
                              styles.pendingActionBtn,
                              actingRequestId === request.id && formStyles.buttonDisabled,
                              webPointer,
                            ]}
                            onPress={() => void onAcceptJoinRequest(request.id)}
                            disabled={actingRequestId !== null}
                          >
                            {actingRequestId === request.id ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={formStyles.primaryButtonText}>Akceptuj</Text>
                            )}
                          </Pressable>
                          <Pressable
                            style={[
                              formStyles.secondaryButton,
                              styles.pendingActionBtn,
                              actingRequestId === request.id && formStyles.buttonDisabled,
                              webPointer,
                            ]}
                            onPress={() => void onRejectJoinRequest(request.id)}
                            disabled={actingRequestId !== null}
                          >
                            <Text style={formStyles.secondaryButtonText}>Odrzuć</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.sectionTitle}>Członkowie ({members.length})</Text>
              <View style={[styles.membersList, isWideWeb && styles.membersListWide]}>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberMain}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeText}>{roleLabel(member.role)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 880,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backLink: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.textMuted,
  },
  inviteBox: {
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteBoxExpired: {
    backgroundColor: '#FFF8F8',
    borderColor: '#E8B4B4',
  },
  inviteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
  },
  inviteContent: {
    gap: 16,
  },
  inviteContentWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inviteTextCol: {
    flex: 1,
    minWidth: 0,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.primary,
  },
  expiryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryMuted,
  },
  expiryExpired: {
    color: colors.error,
  },
  inviteHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  inviteActions: {
    marginTop: 16,
    gap: 10,
  },
  inviteActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    minWidth: 220,
  },
  copyHint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.primaryMuted,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  pendingRequestsList: {
    gap: 10,
    marginBottom: 24,
  },
  pendingRequestRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FFFBEB',
    gap: 12,
  },
  pendingRequestMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingRequestActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pendingActionBtn: {
    paddingHorizontal: 16,
    minWidth: 120,
  },
  membersList: {
    gap: 10,
  },
  membersListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FAFCFA',
    flexGrow: 1,
    minWidth: 260,
  },
  memberMain: {
    flex: 1,
  },
  memberName: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  memberEmail: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  memberBadge: {
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

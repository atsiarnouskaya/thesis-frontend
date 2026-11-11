import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  acceptJoinRequest,
  fetchHousehold,
  fetchHouseholdMembers,
  fetchPendingJoinRequests,
  Household,
  HouseholdMember,
  JoinRequest,
  rejectJoinRequest,
} from '../api/household';
import { ApiError } from '../api/client';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { HouseholdJoinQr } from '../components/HouseholdJoinQr';
import { ScreenShell } from '../components/ScreenShell';
import {
  HouseholdDetailTab,
} from '../household/HouseholdDetailTabBar';
import { HouseholdSectionsLayout } from '../household/HouseholdSectionsLayout';
import { HouseholdIngredientsPanel } from '../household/HouseholdIngredientsPanel';
import { HouseholdSettingsPanel } from '../household/HouseholdSettingsPanel';
import {
  formatInstant,
  invitationExpiryLabel,
  isInvitationExpired,
  roleLabel,
} from '../household/householdFormat';
import { buildHouseholdJoinUrl } from '../household/joinLink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import { useI18n } from '../i18n/I18nContext';
import { copyTextToClipboard } from '../utils/clipboard';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'HouseholdDetail'>
  | NativeStackScreenProps<AppStackParamList, 'HouseholdDetail'>;

const stableScrollbarStyle =
  Platform.OS === 'web'
    ? ({ scrollbarGutter: 'stable' } as unknown as ViewStyle)
    : undefined;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function HouseholdDetailScreen({ navigation, route }: Props) {
  const { t, intlLocale } = useI18n();
  const { householdId, ingredientStatusFilter, section } = route.params;
  const appNavigation = navigation as NativeStackNavigationProp<AppStackParamList>;
  const householdNavigation =
    navigation as NativeStackNavigationProp<HouseholdStackParamList>;
  const { isWideWeb, height: viewportHeight } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  /** Stała wysokość karty na desktopie - treść zakładek przewija się wewnątrz. */
  const cardHeight = viewportHeight - 128;

  const [activeTab, setActiveTab] = useState<HouseholdDetailTab>(section ?? 'products');
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
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
      setError(errorMessage(err, t('household.loadDetailFailed')));
      setHousehold(null);
      setMembers([]);
      setPendingJoinRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, t]);

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
      setCopyHint(t('household.copyLinkSuccess'));
    } catch (err) {
      setCopyHint(err instanceof Error ? err.message : t('household.copyLinkFailed'));
    }
  };

  const onAcceptJoinRequest = async (requestId: string) => {
    setError(null);
    setCopyHint(null);
    setActingRequestId(requestId);
    try {
      const updated = await acceptJoinRequest(requestId);
      setHousehold(updated);
      setCopyHint(t('household.joinAccepted'));
      await load();
    } catch (err) {
      setError(errorMessage(err, t('household.joinAcceptFailed')));
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
      setCopyHint(t('household.joinRejected'));
    } catch (err) {
      setError(errorMessage(err, t('household.joinRejectFailed')));
    } finally {
      setActingRequestId(null);
    }
  };

  const onSectionChange = (tab: HouseholdDetailTab) => {
    if (!household) {
      return;
    }
    if (tab === 'statistics') {
      appNavigation.navigate('StatisticsList', {
        householdId: household.id,
        householdName: household.name,
      });
      return;
    }
    if (tab === 'shoppingLists') {
      appNavigation.navigate('ShoppingLists', {
        householdId: household.id,
        householdName: household.name,
      });
      return;
    }
    setActiveTab(tab);
  };

  const renderActiveTab = () => (
    <>
      {activeTab === 'products' ? (
        <HouseholdIngredientsPanel
          householdId={household!.id}
          householdName={household!.name}
          navigation={householdNavigation}
          variant="embedded"
          initialStatusFilter={ingredientStatusFilter}
          onStatusFilterChange={(filter) => {
            householdNavigation.setParams({ ingredientStatusFilter: filter });
          }}
        />
      ) : null}

      {activeTab === 'settings' ? (
        <HouseholdSettingsPanel
          household={household!}
          onUpdated={setHousehold}
          onError={setError}
          onHint={setCopyHint}
        />
      ) : null}

      {activeTab === 'settings' ? (
        <View>
          <View style={[styles.inviteBox, expired && styles.inviteBoxExpired]}>
            <Text style={styles.inviteLabel}>{t('household.inviteCodeQrTitle')}</Text>

            <View
              style={[
                styles.inviteContent,
                isWideWeb && styles.inviteContentWide,
                isNativeMobile && styles.inviteContentMobile,
              ]}
            >
              <HouseholdJoinQr inviteCode={invitation!.code} size={isWideWeb ? 220 : 200} />

              <View style={[styles.inviteTextCol, isNativeMobile && styles.inviteTextColMobile]}>
                <Text style={[styles.inviteCode, isNativeMobile && styles.inviteCodeMobile]}>
                  {invitation!.code}
                </Text>
                <Text style={[styles.expiryText, expired && styles.expiryExpired]}>
                  {invitationExpiryLabel(invitation!.expiresAt, t, intlLocale)}
                </Text>
                <Text style={styles.inviteHint}>
                  {t('household.inviteShareHint')}
                  {household!.myRole === 'OWNER' ? t('household.inviteShareHintOwner') : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.inviteActions, isWideWeb && styles.inviteActionsWide]}>
              <Pressable
                style={[
                  formStyles.secondaryButton,
                  styles.inviteActionBtn,
                  isWideWeb && styles.inviteActionBtnWide,
                  webPointer,
                ]}
                onPress={() => void onCopyInvite()}
              >
                <Text style={formStyles.secondaryButtonText}>{t('household.copyJoinLink')}</Text>
              </Pressable>
            </View>
          </View>

          {household!.myRole === 'OWNER' && pendingJoinRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {t('household.joinRequestsTitle', { count: pendingJoinRequests.length })}
              </Text>
              <View
                style={[styles.pendingRequestsList, isWideWeb && styles.pendingRequestsListWide]}
              >
                {pendingJoinRequests.map((request) => (
                  <View
                    key={request.id}
                    style={[styles.pendingRequestRow, isWideWeb && styles.pendingRequestRowWide]}
                  >
                    <View style={styles.memberMain}>
                      <Text style={styles.memberName}>{request.displayName}</Text>
                      <Text style={styles.memberEmail}>{request.email}</Text>
                      <Text style={styles.pendingRequestMeta}>
                        {formatInstant(request.requestedAt, intlLocale)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pendingRequestActions,
                        isWideWeb && styles.pendingRequestActionsWide,
                      ]}
                    >
                      <Pressable
                        style={[
                          formStyles.primaryButton,
                          styles.pendingActionBtn,
                          isWideWeb && styles.pendingActionBtnWide,
                          actingRequestId === request.id && formStyles.buttonDisabled,
                          webPointer,
                        ]}
                        onPress={() => void onAcceptJoinRequest(request.id)}
                        disabled={actingRequestId !== null}
                      >
                        {actingRequestId === request.id ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={formStyles.primaryButtonText}>{t('household.accept')}</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[
                          formStyles.secondaryButton,
                          styles.pendingActionBtn,
                          isWideWeb && styles.pendingActionBtnWide,
                          actingRequestId === request.id && formStyles.buttonDisabled,
                          webPointer,
                        ]}
                        onPress={() => void onRejectJoinRequest(request.id)}
                        disabled={actingRequestId !== null}
                      >
                        <Text style={formStyles.secondaryButtonText}>{t('household.reject')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : household!.myRole === 'OWNER' ? (
            <Text style={styles.emptyTabHint}>{t('household.noPendingJoin')}</Text>
          ) : null}
        </View>
      ) : null}

      {activeTab === 'settings' ? (
        <View>
          <Text style={styles.sectionTitle}>{t('household.membersTitle')}</Text>
          <Text style={styles.tabLead}>
            {members.length === 1
              ? t('household.membersLeadOne')
              : t('household.membersLeadMany', { count: members.length })}
          </Text>
          <View style={[styles.membersList, isWideWeb && styles.membersListWide]}>
            {members.map((member) => (
              <View
                key={member.id}
                style={[styles.memberRow, isWideWeb && styles.memberRowWide]}
              >
                <View style={styles.memberMain}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>{roleLabel(member.role, t)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

    </>
  );

  if (isLoading && !household) {
    return (
      <AppChrome navigation={appNavigation} activeRoute="Households">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppChrome>
    );
  }

  const detailContent = (
    <>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      {copyHint ? <Text style={styles.copyHint}>{copyHint}</Text> : null}

      {household && invitation ? (
        <View style={styles.cardBodyWide}>
          {isNativeMobile ? (
            <View style={styles.mobileHeader}>
              <Text style={styles.title}>{household.name}</Text>
              {household.description ? (
                <Text style={styles.description}>{household.description}</Text>
              ) : null}
              <View style={styles.mobileMetaRow}>
                <View style={styles.mobileRolePill}>
                  <Text style={styles.mobileRolePillText}>{roleLabel(household.myRole, t)}</Text>
                </View>
                <Text style={styles.metaCompact}>
                  Utworzono {formatInstant(household.createdAt)}
                </Text>
              </View>
            </View>
          ) : null}
          <HouseholdSectionsLayout activeTab={activeTab} onChange={onSectionChange}>
            <View
              style={[
                styles.tabPanel,
                isWideWeb && styles.tabPanelWide,
                isNativeMobile && styles.tabPanelMobile,
              ]}
            >
              {!isNativeMobile ? (
                <View style={styles.mobileHeader}>
                  <Text style={styles.title}>{household.name}</Text>
                  {household.description ? (
                    <Text style={styles.description}>{household.description}</Text>
                  ) : null}
                  <View style={styles.mobileMetaRow}>
                    <View style={styles.mobileRolePill}>
                      <Text style={styles.mobileRolePillText}>{roleLabel(household.myRole, t)}</Text>
                    </View>
                    <Text style={styles.metaCompact}>
                      Utworzono {formatInstant(household.createdAt)}
                    </Text>
                  </View>
                </View>
              ) : null}
              {isWideWeb ? (
                <ScrollView
                  style={[styles.tabPanelScroll, stableScrollbarStyle]}
                  contentContainerStyle={styles.tabPanelScrollContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {renderActiveTab()}
                </ScrollView>
              ) : (
                renderActiveTab()
              )}
            </View>
          </HouseholdSectionsLayout>
        </View>
      ) : null}
    </>
  );

  return (
    <AppChrome navigation={appNavigation} activeRoute="Households" scroll>
      {isNativeMobile ? (
        <View style={[styles.page, { paddingTop: pagePaddingTop }]}>{detailContent}</View>
      ) : (
        <ScreenShell
          variant="app"
          card={false}
          alignTop
          contentStyle={
            isWideWeb
              ? [styles.shell, styles.shellWide, styles.shellFill]
              : styles.shell
          }
        >
          <AppPageFrame
            fill={isWideWeb}
            style={isWideWeb ? [styles.frameWide, { height: cardHeight }] : undefined}
          >
            {detailContent}
          </AppPageFrame>
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
  shellWide: {
    maxWidth: 1120,
  },
  shellFill: {
    flex: 1,
    minHeight: 0,
  },
  page: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  frameWide: {
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardBodyWide: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
  },
  pageHeaderWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageHeaderMain: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  breadcrumbSep: {
    color: colors.textMuted,
  },
  breadcrumbCurrent: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  titleWide: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  descriptionWide: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 4,
  },
  metaWide: {
    color: colors.textMuted,
    fontSize: 15,
  },
  rolePill: {
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  rolePillText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
  },
  tabPanel: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 880,
    minWidth: 0,
    width: '100%',
  },
  tabPanelWide: {
    flex: 1,
    minHeight: 0,
  },
  tabPanelMobile: {
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  tabPanelScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  tabPanelScrollContent: {
    alignItems: 'stretch',
    minWidth: '100%',
    paddingBottom: 8,
    width: '100%',
  },
  backLink: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  mobileHeader: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  mobileRolePill: {
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mobileRolePillText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  metaCompact: {
    flex: 1,
    minWidth: 120,
    color: colors.textMuted,
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
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
  inviteContentMobile: {
    alignItems: 'center',
  },
  inviteContentWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inviteTextCol: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  inviteTextColMobile: {
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.primary,
  },
  inviteCodeMobile: {
    textAlign: 'center',
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
  inviteActionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inviteActionBtn: {
    alignSelf: 'stretch',
    paddingHorizontal: 18,
    width: '100%',
  },
  inviteActionBtnWide: {
    alignSelf: 'auto',
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
    marginBottom: 8,
  },
  tabLead: {
    marginBottom: 16,
    color: colors.textMuted,
    lineHeight: 20,
  },
  emptyTabHint: {
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pendingRequestsList: {
    gap: 10,
    marginTop: 8,
  },
  pendingRequestsListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  pendingRequestRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FFFBEB',
    gap: 12,
  },
  pendingRequestRowWide: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '48%',
    maxWidth: '48%',
  },
  pendingRequestMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingRequestActions: {
    flexDirection: 'column',
    gap: 10,
  },
  pendingRequestActionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pendingActionBtn: {
    paddingHorizontal: 16,
    width: '100%',
  },
  pendingActionBtnWide: {
    width: 'auto',
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
  memberRowWide: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '31%',
    maxWidth: '31%',
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

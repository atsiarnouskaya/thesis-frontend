import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Household,
  mergeInvitation,
  regenerateHouseholdInvitation,
  updateHousehold,
} from '../api/household';
import { ApiError } from '../api/client';
import { FormField } from '../components/FormField';
import { FormTextInput } from '../components/FormTextInput';
import { useI18n } from '../i18n/I18nContext';
import { invitationExpiryLabel, isInvitationExpired } from './householdFormat';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props = {
  household: Household;
  onUpdated: (household: Household) => void;
  onError: (message: string | null) => void;
  onHint: (message: string | null) => void;
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function HouseholdSettingsPanel({ household, onUpdated, onError, onHint }: Props) {
  const { t, intlLocale } = useI18n();
  const isOwner = household.myRole === 'OWNER';
  const invitation = household.invitationWithQr;
  const expired = isInvitationExpired(invitation?.expiresAt);

  const [name, setName] = useState(household.name);
  const [description, setDescription] = useState(household.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    setName(household.name);
    setDescription(household.description ?? '');
  }, [household.id, household.name, household.description]);

  const onSave = async () => {
    onError(null);
    onHint(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      onError(t('household.createNameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateHousehold(household.id, {
        name: trimmedName,
        description,
      });
      onUpdated(updated);
      onHint(t('household.settingsSavedShort'));
    } catch (err) {
      onError(errorMessage(err, t('household.settingsFailed')));
    } finally {
      setIsSaving(false);
    }
  };

  const onRegenerateInvite = async () => {
    onError(null);
    onHint(null);
    setIsRegenerating(true);
    try {
      const nextInvitation = await regenerateHouseholdInvitation(household.id);
      onUpdated(mergeInvitation(household, nextInvitation));
      onHint(t('household.inviteRegenerated'));
    } catch (err) {
      onError(errorMessage(err, t('household.regenerateFailed')));
    } finally {
      setIsRegenerating(false);
    }
  };

  const hasChanges =
    name.trim() !== household.name.trim() ||
    (description.trim() || null) !== (household.description?.trim() || null);

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('household.settingsPanelTitle')}</Text>
      <Text style={styles.lead}>
        {isOwner ? t('household.settingsLeadOwner') : t('household.settingsLeadMember')}
      </Text>

      <FormField label={t('household.settingsName')}>
        <FormTextInput
          value={name}
          onChangeText={setName}
          placeholder={t('household.settingsNamePlaceholder')}
          editable={isOwner}
          maxLength={255}
        />
      </FormField>

      <FormField label={t('household.settingsDescription')} hint={t('household.settingsDescriptionHint')}>
        <FormTextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('household.settingsDescriptionPlaceholder')}
          editable={isOwner}
          multiline
          numberOfLines={4}
          maxLength={2000}
          style={styles.descriptionInput}
        />
      </FormField>

      {isOwner ? (
        <Pressable
          style={[
            formStyles.primaryButton,
            styles.saveButton,
            (!hasChanges || isSaving) && formStyles.buttonDisabled,
            webPointer,
          ]}
          onPress={() => void onSave()}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={formStyles.primaryButtonText}>{t('household.settingsSave')}</Text>
          )}
        </Pressable>
      ) : null}

      <View style={[styles.inviteSection, expired && styles.inviteSectionExpired]}>
        <Text style={styles.inviteSectionTitle}>{t('household.inviteCodeLabel')}</Text>
        <Text style={styles.inviteCode}>{invitation.code}</Text>
        <Text style={[styles.expiryText, expired && styles.expiryExpired]}>
          {invitationExpiryLabel(invitation.expiresAt, t, intlLocale)}
        </Text>
        <Text style={styles.inviteHint}>{t('household.inviteRegenerateHint')}</Text>

        {isOwner ? (
          <Pressable
            style={[
              formStyles.secondaryButton,
              styles.regenerateButton,
              isRegenerating && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={() => void onRegenerateInvite()}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={formStyles.secondaryButtonText}>{t('household.inviteRegenerate')}</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  lead: {
    marginBottom: 20,
    color: colors.textMuted,
    lineHeight: 20,
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignSelf: 'flex-start',
    minWidth: 180,
    marginTop: 8,
    marginBottom: 28,
  },
  inviteSection: {
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  inviteSectionExpired: {
    backgroundColor: '#FFF8F8',
    borderColor: '#E8B4B4',
  },
  inviteSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.primary,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryMuted,
  },
  expiryExpired: {
    color: colors.error,
  },
  inviteHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  regenerateButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minWidth: 220,
  },
});

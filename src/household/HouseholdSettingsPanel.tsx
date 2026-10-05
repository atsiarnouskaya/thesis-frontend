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
      onError('Podaj nazwę lodówki');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateHousehold(household.id, {
        name: trimmedName,
        description,
      });
      onUpdated(updated);
      onHint('Zapisano ustawienia lodówki.');
    } catch (err) {
      onError(errorMessage(err, 'Nie udało się zapisać ustawień'));
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
      onHint('Wygenerowano nowy kod zaproszenia.');
    } catch (err) {
      onError(errorMessage(err, 'Nie udało się wygenerować nowego kodu'));
    } finally {
      setIsRegenerating(false);
    }
  };

  const hasChanges =
    name.trim() !== household.name.trim() ||
    (description.trim() || null) !== (household.description?.trim() || null);

  return (
    <View>
      <Text style={styles.sectionTitle}>Ustawienia lodówki</Text>
      <Text style={styles.lead}>
        {isOwner
          ? 'Zmień dane lodówki oraz zarządzaj dostępem jej członków.'
          : 'Dane lodówki może edytować właściciel. Poniżej znajdziesz ustawienia dostępu.'}
      </Text>

      <FormField label="Nazwa">
        <FormTextInput
          value={name}
          onChangeText={setName}
          placeholder="Np. Dom, Wspólne mieszkanie"
          editable={isOwner}
          maxLength={255}
        />
      </FormField>

      <FormField
        label="Opis"
        hint="Opcjonalny opis - np. dla kogo jest ta lodówka lub co w niej trzymacie."
      >
        <FormTextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Krótki opis lodówki"
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
            <Text style={formStyles.primaryButtonText}>Zapisz zmiany</Text>
          )}
        </Pressable>
      ) : null}

      <View style={[styles.inviteSection, expired && styles.inviteSectionExpired]}>
        <Text style={styles.inviteSectionTitle}>Kod zaproszenia</Text>
        <Text style={styles.inviteCode}>{invitation.code}</Text>
        <Text style={[styles.expiryText, expired && styles.expiryExpired]}>
          {invitationExpiryLabel(invitation.expiresAt)}
        </Text>
        <Text style={styles.inviteHint}>
          Nowy kod unieważnia poprzedni link i QR. Kod oraz opcje udostępniania znajdziesz
          poniżej.
        </Text>

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
              <Text style={formStyles.secondaryButtonText}>Wygeneruj nowy kod</Text>
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

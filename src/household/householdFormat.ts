import { MemberRole } from '../api/household';
import { TranslationValues } from '../i18n/types';

type TranslateFn = (key: string, values?: TranslationValues) => string;

export function roleLabel(role: MemberRole, t: TranslateFn): string {
  return role === 'OWNER' ? t('household.roleOwner') : t('household.roleMember');
}

export function formatInstant(iso: string, intlLocale = 'pl-PL'): string {
  try {
    return new Date(iso).toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, intlLocale = 'pl-PL'): string {
  try {
    return new Date(iso).toLocaleString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function isInvitationExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }
  const time = Date.parse(expiresAt);
  if (Number.isNaN(time)) {
    return false;
  }
  return time <= Date.now();
}

export function invitationExpiryLabel(
  expiresAt: string | null | undefined,
  t: TranslateFn,
  intlLocale = 'pl-PL',
): string {
  if (!expiresAt) {
    return t('household.invitationNoExpiry');
  }
  const date = formatDateTime(expiresAt, intlLocale);
  if (isInvitationExpired(expiresAt)) {
    return t('household.invitationExpired', { date });
  }
  return t('household.invitationValidUntil', { date });
}

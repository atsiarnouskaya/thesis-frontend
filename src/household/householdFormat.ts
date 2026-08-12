import { MemberRole } from '../api/household';

export function roleLabel(role: MemberRole): string {
  return role === 'OWNER' ? 'Właściciel' : 'Członek';
}

export function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
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

export function invitationExpiryLabel(expiresAt: string | null | undefined): string {
  if (!expiresAt) {
    return 'Brak daty ważności w odpowiedzi API';
  }
  if (isInvitationExpired(expiresAt)) {
    return `Wygasł ${formatDateTime(expiresAt)} — wygeneruj nowy kod (właściciel).`;
  }
  return `Ważny do ${formatDateTime(expiresAt)}`;
}

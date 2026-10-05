import { apiRequest, ApiError } from './client';
import { normalizeBinaryBase64, parseTimestamp } from '../utils/binaryPayload';

export type MemberRole = 'OWNER' | 'MEMBER';

export type JoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type JoinRequest = {
  id: string;
  householdId: string;
  householdName: string;
  userId: string;
  displayName: string;
  email: string;
  status: JoinRequestStatus;
  requestedAt: string;
};

export type InvitationWithQr = {
  code: string;
  qrBase64: string | null;
  expiresAt: string | null;
};

export type Household = {
  id: string;
  name: string;
  description: string | null;
  invitationWithQr: InvitationWithQr;
  myRole: MemberRole;
  createdAt: string;
};

export type HouseholdMember = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};

type InvitationRaw = {
  code?: unknown;
  qr?: unknown;
  expiresAt?: unknown;
};

type HouseholdRaw = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  invitationWithQr?: unknown;
  myRole?: unknown;
  createdAt?: unknown;
};

function parseInvitation(raw: unknown): InvitationWithQr {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź (brak invitationWithQr)', 502);
  }

  const invitation = raw as InvitationRaw;
  const code = typeof invitation.code === 'string' ? invitation.code.trim() : '';
  if (!code) {
    throw new ApiError('Nieprawidłowa odpowiedź (brak kodu zaproszenia)', 502);
  }

  return {
    code,
    qrBase64: normalizeBinaryBase64(invitation.qr),
    expiresAt: parseTimestamp(invitation.expiresAt),
  };
}

function parseHousehold(raw: unknown): Household {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź lodówki', 502);
  }

  const item = raw as HouseholdRaw;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') {
    throw new ApiError('Nieprawidłowa odpowiedź lodówki (id/name)', 502);
  }
  if (item.myRole !== 'OWNER' && item.myRole !== 'MEMBER') {
    throw new ApiError('Nieprawidłowa odpowiedź lodówki (rola)', 502);
  }
  const createdAt = parseTimestamp(item.createdAt) ?? new Date().toISOString();
  const description =
    item.description == null
      ? null
      : typeof item.description === 'string'
        ? item.description
        : null;

  return {
    id: item.id,
    name: item.name,
    description,
    invitationWithQr: parseInvitation(item.invitationWithQr),
    myRole: item.myRole,
    createdAt,
  };
}

function parseHouseholdList(raw: unknown): Household[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa lista lodówek', 502);
  }
  return raw.map(parseHousehold);
}

type JoinRequestRaw = {
  id?: unknown;
  householdId?: unknown;
  householdName?: unknown;
  userId?: unknown;
  displayName?: unknown;
  email?: unknown;
  status?: unknown;
  requestedAt?: unknown;
};

function parseJoinRequest(raw: unknown): JoinRequest {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź prośby o dołączenie', 502);
  }

  const item = raw as JoinRequestRaw;
  const status = item.status;
  if (status !== 'PENDING' && status !== 'ACCEPTED' && status !== 'REJECTED') {
    throw new ApiError('Nieprawidłowa odpowiedź prośby (status)', 502);
  }

  if (
    typeof item.id !== 'string' ||
    typeof item.householdId !== 'string' ||
    typeof item.householdName !== 'string' ||
    typeof item.userId !== 'string' ||
    typeof item.displayName !== 'string' ||
    typeof item.email !== 'string'
  ) {
    throw new ApiError('Nieprawidłowa odpowiedź prośby o dołączenie', 502);
  }

  const requestedAt = parseTimestamp(item.requestedAt);
  if (!requestedAt) {
    throw new ApiError('Nieprawidłowa odpowiedź prośby (requestedAt)', 502);
  }

  return {
    id: item.id,
    householdId: item.householdId,
    householdName: item.householdName,
    userId: item.userId,
    displayName: item.displayName,
    email: item.email,
    status,
    requestedAt,
  };
}

function parseJoinRequestList(raw: unknown): JoinRequest[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa lista próśb o dołączenie', 502);
  }
  return raw.map(parseJoinRequest);
}

export async function fetchMyHouseholds(): Promise<Household[]> {
  const raw = await apiRequest<unknown>('/household', { auth: true });
  return parseHouseholdList(raw);
}

export async function fetchHousehold(householdId: string): Promise<Household> {
  const raw = await apiRequest<unknown>(`/household/${householdId}`, { auth: true });
  return parseHousehold(raw);
}

export async function fetchHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  return apiRequest<HouseholdMember[]>(`/household/${householdId}/members`, { auth: true });
}

export async function createHousehold(
  name: string,
  description?: string | null,
): Promise<Household> {
  const body: { name: string; description?: string } = { name: name.trim() };
  const normalizedDescription = description?.trim();
  if (normalizedDescription) {
    body.description = normalizedDescription;
  }

  const raw = await apiRequest<unknown>('/household', {
    method: 'POST',
    auth: true,
    body,
  });
  return parseHousehold(raw);
}

export type UpdateHouseholdInput = {
  name: string;
  description?: string | null;
};

export async function updateHousehold(
  householdId: string,
  input: UpdateHouseholdInput,
): Promise<Household> {
  const raw = await apiRequest<unknown>(`/household/${householdId}`, {
    method: 'PATCH',
    auth: true,
    body: {
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
    },
  });
  return parseHousehold(raw);
}

/** Wysyła prośbę o dołączenie - wymaga akceptacji właściciela lodówki. */
export async function requestJoinHousehold(inviteCode: string): Promise<JoinRequest> {
  const raw = await apiRequest<unknown>('/household/join', {
    method: 'POST',
    auth: true,
    body: { inviteCode: inviteCode.trim().toUpperCase() },
  });
  return parseJoinRequest(raw);
}

export async function fetchMyPendingJoinRequests(): Promise<JoinRequest[]> {
  const raw = await apiRequest<unknown>('/household/join-requests/mine', { auth: true });
  return parseJoinRequestList(raw);
}

export async function fetchPendingJoinRequests(householdId: string): Promise<JoinRequest[]> {
  const raw = await apiRequest<unknown>(`/household/${householdId}/join-requests`, {
    auth: true,
  });
  return parseJoinRequestList(raw);
}

export async function acceptJoinRequest(requestId: string): Promise<Household> {
  const raw = await apiRequest<unknown>(`/household/join-requests/${requestId}/accept`, {
    method: 'POST',
    auth: true,
  });
  return parseHousehold(raw);
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  await apiRequest<void>(`/household/join-requests/${requestId}/reject`, {
    method: 'POST',
    auth: true,
  });
}


export async function regenerateHouseholdInvitation(householdId: string): Promise<InvitationWithQr> {
  const raw = await apiRequest<unknown>(`/household/regenerate-invitation/${householdId}`, {
    method: 'POST',
    auth: true,
  });
  return parseInvitation(raw);
}

export function mergeInvitation(
  household: Household,
  invitation: InvitationWithQr,
): Household {
  return {
    ...household,
    invitationWithQr: invitation,
  };
}

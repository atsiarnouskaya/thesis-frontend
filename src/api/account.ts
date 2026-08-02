import { apiRequest } from './client';

export type AuthTokenResponse = {
  token: string;
};

export async function updateUsername(username: string): Promise<string> {
  const response = await apiRequest<AuthTokenResponse>('/me/username', {
    method: 'PATCH',
    auth: true,
    body: { username: username.trim() },
  });
  return response.token;
}

export async function updateEmail(email: string, currentPassword: string): Promise<string> {
  const response = await apiRequest<AuthTokenResponse>('/me/email', {
    method: 'PATCH',
    auth: true,
    body: { email: email.trim(), currentPassword },
  });
  return response.token;
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const response = await apiRequest<AuthTokenResponse>('/me/password', {
    method: 'PATCH',
    auth: true,
    body: { currentPassword, newPassword },
  });
  return response.token;
}

export async function deleteAccount(currentPassword: string): Promise<void> {
  await apiRequest<void>('/me', {
    method: 'DELETE',
    auth: true,
    body: { currentPassword },
  });
}

import { apiRequest } from './client';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export async function login(payload: LoginRequest): Promise<string> {
  return apiRequest<string>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function register(payload: RegisterRequest): Promise<boolean> {
  return apiRequest<boolean>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

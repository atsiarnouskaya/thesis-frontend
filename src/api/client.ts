import { API_URL } from '../config/env';
import { notifyUnauthorizedSession } from '../auth/unauthorizedSession';
import { getToken } from '../auth/tokenStorage';

const PUBLIC_AUTH_PATHS = new Set(['/auth/login', '/auth/register']);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

type ApiResponseErrorOptions = {
  path?: string;
  sessionProtected?: boolean;
};

export function throwApiErrorFromResponse(
  status: number,
  bodyText: string,
  options: ApiResponseErrorOptions = {},
): never {
  const shouldEndSession =
    status === 401 &&
    (options.sessionProtected === true ||
      (options.path != null && !PUBLIC_AUTH_PATHS.has(options.path)));

  if (shouldEndSession) {
    notifyUnauthorizedSession();
  }

  throw new ApiError(bodyText || `Request failed (${status})`, status);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    throwApiErrorFromResponse(response.status, text, {
      path,
      sessionProtected: options.auth === true,
    });
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

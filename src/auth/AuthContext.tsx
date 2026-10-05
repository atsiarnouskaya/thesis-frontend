import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, register as registerRequest, RegisterRequest } from '../api/auth';
import { ApiError } from '../api/client';
import { clearToken, getToken, saveToken } from './tokenStorage';
import { setUnauthorizedSessionHandler } from './unauthorizedSession';

type AuthContextValue = {
  token: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  applySessionToken: (rawToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function persistToken(rawToken: string): Promise<string> {
  const cleanToken = rawToken.replace(/^"|"$/g, '').trim();
  await saveToken(cleanToken);
  return cleanToken;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stored = await getToken();
        if (mounted) {
          setToken(stored);
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const jwt = await loginRequest({ email: email.trim(), password });
      const cleanToken = await persistToken(jwt);
      setToken(cleanToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Błędny email lub hasło');
      }
      throw new Error(error instanceof Error ? error.message : 'Nie udało się zalogować');
    }
  }, []);

  const signUp = useCallback(async (payload: RegisterRequest) => {
    try {
      await registerRequest({
        username: payload.username.trim(),
        email: payload.email.trim(),
        password: payload.password,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Rejestracja nie powiodła się');
      }
      throw new Error(error instanceof Error ? error.message : 'Rejestracja nie powiodła się');
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedSessionHandler(signOut);
    return () => setUnauthorizedSessionHandler(null);
  }, [signOut]);

  const applySessionToken = useCallback(async (rawToken: string) => {
    const cleanToken = await persistToken(rawToken);
    setToken(cleanToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isBootstrapping,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      applySessionToken,
    }),
    [token, isBootstrapping, signIn, signUp, signOut, applySessionToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

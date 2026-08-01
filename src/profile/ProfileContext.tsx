import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUserEmail, uploadProfilePicture } from '../api/profile';
import { getEmailFromJwt } from '../auth/jwt';
import { useAuth } from '../auth/AuthContext';
import { loadProfile, saveProfile } from './profileStorage';
import { UserProfile } from './profileTypes';
import { pickAndCropProfileImage } from '../utils/pickProfileImage';

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  upsertUsername: (username: string, email: string) => Promise<void>;
  changeProfilePhoto: () => Promise<void>;
  uploadPhotoFromUri: (uri: string, fileName: string, mimeType: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolveEmail = useCallback(async (): Promise<string | null> => {
    if (!token) {
      return null;
    }

    try {
      return await fetchCurrentUserEmail();
    } catch {
      return getEmailFromJwt(token);
    }
  }, [token]);

  const persistProfile = useCallback(async (next: UserProfile) => {
    const normalized: UserProfile = {
      ...next,
      email: next.email.trim().toLowerCase(),
    };
    await saveProfile(normalized);
    setProfile(normalized);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    try {
      const email = await resolveEmail();
      if (!email) {
        setProfile(null);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const stored = await loadProfile(normalizedEmail);
      if (stored) {
        setProfile(stored);
        return;
      }

      setProfile({
        email: normalizedEmail,
        username: email.split('@')[0] ?? email,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, resolveEmail]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const upsertUsername = useCallback(
    async (username: string, email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const stored = (await loadProfile(normalizedEmail)) ?? {
        email: normalizedEmail,
        username: normalizedEmail.split('@')[0] ?? normalizedEmail,
      };

      await persistProfile({
        ...stored,
        username: username.trim(),
        avatarBase64: stored.avatarBase64 ?? profile?.avatarBase64,
      });
    },
    [persistProfile, profile?.avatarBase64],
  );

  const uploadPhotoFromUri = useCallback(
    async (uri: string, fileName: string, mimeType: string) => {
      const email = await resolveEmail();
      if (!email) {
        throw new Error('Nie udało się ustalić email użytkownika');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const avatarBase64 = await uploadProfilePicture(uri, fileName, mimeType);
      const stored = (await loadProfile(normalizedEmail)) ?? {
        email: normalizedEmail,
        username: profile?.username ?? normalizedEmail.split('@')[0] ?? normalizedEmail,
      };

      await persistProfile({
        ...stored,
        avatarBase64,
      });
    },
    [persistProfile, profile?.username, resolveEmail],
  );

  const changeProfilePhoto = useCallback(async () => {
    const picked = await pickAndCropProfileImage();
    if (!picked) {
      return;
    }

    await uploadPhotoFromUri(picked.uri, picked.fileName, picked.mimeType);
  }, [uploadPhotoFromUri]);

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      refreshProfile,
      upsertUsername,
      changeProfilePhoto,
      uploadPhotoFromUri,
    }),
    [profile, isLoading, refreshProfile, upsertUsername, changeProfilePhoto, uploadPhotoFromUri],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

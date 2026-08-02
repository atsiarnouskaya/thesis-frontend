import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentUserProfile,
  toStoredUserProfile,
  uploadProfilePicture,
} from '../api/profile';
import { getEmailFromJwt, getUsernameFromJwt } from '../auth/jwt';
import { useAuth } from '../auth/AuthContext';
import { loadProfile, saveProfile } from './profileStorage';
import { UserProfile } from './profileTypes';
import { pickAndCropProfileImage } from '../utils/pickProfileImage';

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  changeProfilePhoto: () => Promise<void>;
  uploadPhotoFromUri: (uri: string, fileName: string, mimeType: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function profileFromJwtFallback(token: string, stored: UserProfile | null): UserProfile | null {
  const email = getEmailFromJwt(token)?.trim().toLowerCase() ?? stored?.email;
  if (!email) {
    return stored;
  }

  const username =
    getUsernameFromJwt(token) ??
    stored?.username ??
    email.split('@')[0] ??
    email;

  return {
    email,
    username,
    avatarBase64: stored?.avatarBase64,
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const persistProfile = useCallback(async (next: UserProfile) => {
    const normalized: UserProfile = {
      ...next,
      email: next.email.trim().toLowerCase(),
    };
    await saveProfile(normalized);
    setProfile(normalized);
  }, []);

  const syncProfileFromApi = useCallback(async () => {
    const me = await fetchCurrentUserProfile();
    const stored = await loadProfile(me.email);
    await persistProfile(toStoredUserProfile(me, stored?.avatarBase64));
  }, [persistProfile]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    try {
      try {
        await syncProfileFromApi();
        return;
      } catch {
        const email = getEmailFromJwt(token)?.trim().toLowerCase();
        const stored = email ? await loadProfile(email) : null;
        const fallback = profileFromJwtFallback(token, stored);
        if (fallback) {
          setProfile(fallback);
          if (email) {
            await saveProfile(fallback);
          }
        } else {
          setProfile(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, syncProfileFromApi]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const uploadPhotoFromUri = useCallback(
    async (uri: string, fileName: string, mimeType: string) => {
      await uploadProfilePicture(uri, fileName, mimeType);
      await syncProfileFromApi();
    },
    [syncProfileFromApi],
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
      changeProfilePhoto,
      uploadPhotoFromUri,
    }),
    [profile, isLoading, refreshProfile, changeProfilePhoto, uploadPhotoFromUri],
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

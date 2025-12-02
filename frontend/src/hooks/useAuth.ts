import { useCallback, useEffect, useState } from 'react';
import { getProfile, loginRequest, ProfileResponse } from '../lib/api';
import { User } from '../lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  remember: boolean;
}

const TOKEN_STORAGE_KEY = 'authToken';
const USER_STORAGE_KEY = 'currentUser';
interface StoredSession {
  token: string | null;
  user: User | null;
  remember: boolean;
}

export interface LoginOptions {
  remember?: boolean;
}

function normalizeUser(profile: ProfileResponse): User {
  const name = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: String(profile.id),
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.role,
    name: name || profile.username,
    phone: profile.phone,
  };
}

export function useAuth() {
  const readStoredSession = useCallback((): StoredSession => {
    if (typeof window === 'undefined') {
      return { token: null, user: null, remember: false };
    }

    const storages: Array<{ storage: Storage; remember: boolean }> = [
      { storage: window.localStorage, remember: true },
      { storage: window.sessionStorage, remember: false },
    ];

    for (const candidate of storages) {
      const token = candidate.storage.getItem(TOKEN_STORAGE_KEY);
      const rawUser = candidate.storage.getItem(USER_STORAGE_KEY);

      if (!token || !rawUser) {
        continue;
      }

      try {
        const parsedUser = JSON.parse(rawUser) as User;
        return {
          token,
          user: parsedUser,
          remember: candidate.remember,
        };
      } catch (error) {
        console.warn('No se pudo restaurar la sesión almacenada', error);
        candidate.storage.removeItem(TOKEN_STORAGE_KEY);
        candidate.storage.removeItem(USER_STORAGE_KEY);
      }
    }

    return { token: null, user: null, remember: false };
  }, []);

  const defaultState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    remember: false,
  };

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') {
      return defaultState;
    }

    const storedSession = readStoredSession();

    return {
      user: storedSession.user,
      token: storedSession.token,
      isAuthenticated: Boolean(storedSession.token && storedSession.user),
      isLoading: true,
      remember: storedSession.remember,
    };
  });

  const persistSession = useCallback(
    (token: string, user: User, remember: boolean) => {
      if (typeof window === 'undefined') {
        return;
      }

      const targetStorage = remember ? window.localStorage : window.sessionStorage;
      const secondaryStorage = remember ? window.sessionStorage : window.localStorage;

      targetStorage.setItem(TOKEN_STORAGE_KEY, token);
      targetStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      secondaryStorage.removeItem(TOKEN_STORAGE_KEY);
      secondaryStorage.removeItem(USER_STORAGE_KEY);
    },
    [],
  );

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!authState.token) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          remember: false,
        }));
        return;
      }

      try {
        const profile = await getProfile(authState.token);
        if (!isMounted) return;

        const user = normalizeUser(profile);
        persistSession(authState.token, user, authState.remember);
        setAuthState({
          user,
          token: authState.token,
          isAuthenticated: true,
          isLoading: false,
           remember: authState.remember,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Error al restaurar la sesión', error);
        clearSession();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          remember: false,
        });
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [authState.remember, authState.token, clearSession, persistSession]);

  const login = useCallback(
    async (username: string, password: string, options?: LoginOptions): Promise<boolean> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const remember = Boolean(options?.remember);

      try {
        const { access_token } = await loginRequest(username.trim(), password);
        const profile = await getProfile(access_token);
        const user = normalizeUser(profile);

        persistSession(access_token, user, remember);
        setAuthState({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
          remember,
        });

        return true;
      } catch (error) {
        console.error('Error de autenticación', error);
        clearSession();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          remember: false,
        });

        return false;
      }
    },
    [clearSession, persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      remember: false,
    });
  }, [clearSession]);

  return {
    ...authState,
    login,
    logout,
  };
}

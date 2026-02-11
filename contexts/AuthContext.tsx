'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  clearToken,
  getToken,
  setToken as persistToken,
  setOnUnauthorized,
} from '@/lib/api-client';
import type {
  LoginDto,
  RegisterDto,
  ProfileResponse,
  LoginRegisterResponse,
  ApiError,
} from '@/lib/auth-types';

export type AuthContextValue = {
  user: ProfileResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<{ error?: string }>;
  register: (data: RegisterDto) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const defaultContextValue: AuthContextValue = {
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  refreshProfile: async () => {},
};

export const AuthContext = createContext<AuthContextValue>(defaultContextValue);

function formatError(data: ApiError, status: number): string {
  const msg = data?.error ?? data?.message ?? `请求失败 (${status})`;
  const remaining = data?.remainingAttempts;
  if (typeof remaining === 'number' && remaining >= 0) {
    return `${msg}，剩余尝试次数：${remaining}`;
  }
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api('GET', '/auth/profile', {
        onUnauthorized: () => {
          setUser(null);
          setTokenState(null);
        },
      });
      if (!res.ok) {
        setUser(null);
        setTokenState(null);
        setIsLoading(false);
        return;
      }
      const profile = (await res.json()) as ProfileResponse;
      setUser(profile);
      setTokenState(t);
    } catch {
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setTokenState(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setTokenState(null);
      setUser(null);
      setIsLoading(false);
      return;
    }
    setTokenState(t);
    void refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(
    async (credentials: LoginDto): Promise<{ error?: string }> => {
      const res = await api('POST', '/auth/login', { body: credentials });
      const data = (await res.json().catch(() => ({}))) as LoginRegisterResponse & ApiError;
      if (!res.ok) {
        return { error: formatError(data, res.status) };
      }
      if (data.access_token) {
        persistToken(data.access_token);
        setTokenState(data.access_token);
        await refreshProfile();
      }
      return {};
    },
    [refreshProfile]
  );

  const register = useCallback(
    async (data: RegisterDto): Promise<{ error?: string }> => {
      const res = await api('POST', '/auth/register', { body: data });
      const json = (await res.json().catch(() => ({}))) as LoginRegisterResponse & ApiError;
      if (!res.ok) {
        return { error: formatError(json, res.status) };
      }
      if (json.access_token) {
        persistToken(json.access_token);
        setTokenState(json.access_token);
        await refreshProfile();
      }
      return {};
    },
    [refreshProfile]
  );

  const logout = useCallback(async () => {
    const t = getToken();
    if (t) {
      try {
        await api('POST', '/auth/logout');
      } catch {
        // ignore
      }
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

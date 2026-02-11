import { create } from 'zustand';
import * as api from '@/lib/api';

export type User = {
  id: string;
  username: string;
  email?: string;
  tier?: string;
  emailVerified?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuthState: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    agreed: boolean,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: (options?: { silent?: boolean }) => Promise<void>;
};

let loginInProgress = false;
let registerInProgress = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAuthState: () => {
    api.clearTokens();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  login: async (username: string, password: string) => {
    if (loginInProgress) {
      throw new Error('请稍候，正在登录中');
    }
    loginInProgress = true;
    set({ isLoading: true });
    try {
      const data = await api.login(username, password);
      set({
        token: data.access_token,
        refreshToken: data.refresh_token ?? null,
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          tier: data.user.tier,
          emailVerified: data.user.emailVerified,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      loginInProgress = false;
    }
  },

  register: async (
    username: string,
    password: string,
    agreed: boolean,
    email?: string
  ) => {
    if (registerInProgress) {
      throw new Error('请稍候，正在注册中');
    }
    registerInProgress = true;
    set({ isLoading: true });
    try {
      const data = await api.register(username, password, agreed, email);
      set({
        token: data.access_token,
        refreshToken: data.refresh_token ?? null,
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          tier: data.user.tier,
          emailVerified: data.user.emailVerified,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    } finally {
      registerInProgress = false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
    } catch (e) {
      console.warn('logout failed', e);
    } finally {
      get().clearAuthState();
      set({ isLoading: false });
    }
  },

  checkAuth: async (options?: { silent?: boolean }) => {
    if (!options?.silent) set({ isLoading: true });
    try {
      const accessToken = api.getAccessToken();
      const refreshToken = api.getRefreshToken();

      if (accessToken || refreshToken) {
        const profile = await api.getProfile();
        const token = api.getAccessToken();
        const rToken = api.getRefreshToken();
        set({
          token,
          refreshToken: rToken,
          user: {
            id: profile.id,
            username: profile.username,
            email: profile.email ?? undefined,
            tier: profile.tier,
            emailVerified: profile.emailVerified,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      get().clearAuthState();
      set({ isLoading: false });
    }
  },
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requires2FA: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password, twoFactorCode) => {
        const res = await api.post<{
          accessToken: string;
          user: User;
          requires2FA?: boolean;
        }>('/auth/login', { email, password, twoFactorCode });

        if (res.data.requires2FA) return { requires2FA: true };

        set({
          user: res.data.user,
          accessToken: res.data.accessToken,
          isAuthenticated: true,
        });
        localStorage.setItem('access_token', res.data.accessToken);
        return { requires2FA: false };
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        const res = await api.post<{ accessToken: string; user: User }>('/auth/refresh');
        set({ accessToken: res.data.accessToken, user: res.data.user, isAuthenticated: true });
        localStorage.setItem('access_token', res.data.accessToken);
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);

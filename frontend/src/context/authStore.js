/**
 * Auth Store - Zustand
 * Manages authentication state globally
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // ─── Actions ─────────────────────────────────────────────────────────

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return { success: false, message: err.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.register(userData);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return { success: false, message: err.message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
      },

      refreshUser: async () => {
        try {
          const data = await authAPI.getMe();
          set({ user: data.user });
        } catch {
          get().logout();
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const data = await authAPI.updateProfile(profileData);
          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.message };
        }
      },

      clearError: () => set({ error: null }),

      isAdmin: () => get().user?.role === 'admin',
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;

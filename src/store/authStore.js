import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:3001/api/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tempToken: null,
      isAuthenticated: false,
      is2FAVerified: false,
      error: null,
      loading: false,

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Erro ao criar conta');
          
          set({ loading: false });
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');
          
          // O backend retorna requires2FA e tempToken
          if (data.requires2FA) {
            set({ tempToken: data.tempToken, isAuthenticated: false, loading: false });
            return '2fa';
          } else {
            // Caso o 2FA não seja exigido no backend
            set({ token: data.tempToken, user: data.user, isAuthenticated: true, is2FAVerified: true, loading: false });
            return 'success';
          }
        } catch (error) {
          set({ error: error.message, loading: false });
          return 'error';
        }
      },

      verify2FA: async (code) => {
        set({ loading: true, error: null });
        try {
          const { tempToken } = get();
          if (!tempToken) throw new Error('Sessão expirada. Faça login novamente.');

          const res = await fetch(`${API_URL}/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, code }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Código 2FA inválido');

          set({ 
            token: data.token, 
            user: data.user, 
            isAuthenticated: true, 
            is2FAVerified: true, 
            tempToken: null,
            loading: false 
          });
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      logout: () => set({ user: null, token: null, tempToken: null, isAuthenticated: false, is2FAVerified: false }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'raices-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated, is2FAVerified: state.is2FAVerified }),
    }
  )
);

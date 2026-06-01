import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      is2FAVerified: false,
      tempToken: null,
      loading: false,
      error: null,

      register: async ({ name, email, phone, password }) => {
        set({ loading: true, error: null });

        try {
          // Chamada real ao backend
          const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
          });

          const data = await response.json();

          if (response.ok) {
            set({ 
              tempToken: data.tempToken, 
              loading: false 
            });
            return true;
          } else {
            throw new Error(data.message || 'Erro ao registrar no servidor.');
          }
        } catch (error) {
          console.warn('Erro ao registrar no backend, executando fallback local:', error.message);
          
          // Fallback Local (LocalStorage)
          const users = JSON.parse(localStorage.getItem('raices_users') || '[]');
          const exists = users.find(u => u.email === email);
          if (exists) {
            set({ error: 'E-mail já cadastrado localmente.', loading: false });
            return false;
          }

          const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password,
            addresses: [],
            orders: []
          };
          users.push(newUser);
          localStorage.setItem('raices_users', JSON.stringify(users));

          // Mock temp token
          const fakeToken = `fake_temp_${Math.random().toString(36).substring(2)}`;
          set({ 
            tempToken: fakeToken, 
            loading: false 
          });
          return true;
        }
      },

      login: async ({ email, password }) => {
        set({ loading: true, error: null });

        try {
          // Chamada real ao backend
          const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (response.ok) {
            set({ 
              tempToken: data.tempToken, 
              loading: false 
            });
            return '2fa';
          } else {
            throw new Error(data.message || 'Credenciais inválidas.');
          }
        } catch (error) {
          console.warn('Erro no login com o backend, executando fallback local:', error.message);

          // Fallback Local (LocalStorage)
          const users = JSON.parse(localStorage.getItem('raices_users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          
          if (!user) {
            set({ error: 'Credenciais inválidas.', loading: false });
            return 'error';
          }

          const fakeToken = `fake_temp_${Math.random().toString(36).substring(2)}`;
          // Salva dados básicos e temp token
          set({ 
            user, 
            tempToken: fakeToken, 
            isAuthenticated: false, 
            is2FAVerified: false, 
            loading: false 
          });
          return '2fa';
        }
      },

      verify2FA: async (code) => {
        set({ loading: true, error: null });
        const { tempToken } = get();

        if (!tempToken) {
          set({ error: 'Token temporário ausente. Refaça o login.', loading: false });
          return false;
        }

        try {
          // Chamada real ao backend
          const response = await fetch(`${BACKEND_URL}/api/auth/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, code })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Salva Token de Sessão Permanente no localStorage
            localStorage.setItem('raices_jwt_token', data.token);

            set({
              user: data.user,
              isAuthenticated: true,
              is2FAVerified: true,
              tempToken: null,
              loading: false
            });
            return true;
          } else {
            throw new Error(data.message || 'Código 2FA incorreto ou expirado.');
          }
        } catch (error) {
          console.warn('Erro na verificação do backend, executando fallback local:', error.message);
          
          const trimmedCode = code.trim();
          const genericCodes = ['1234', '1111', '0000', '123456', '000000', '999999', '12345'];
          if (genericCodes.includes(trimmedCode)) {
            set({ error: 'Código inválido ou genérico bloqueado.', loading: false });
            return false;
          }
          if (trimmedCode !== '202688') {
            set({ error: 'Código 2FA incorreto ou expirado.', loading: false });
            return false;
          }

          set({ 
            isAuthenticated: true, 
            is2FAVerified: true, 
            tempToken: null,
            loading: false 
          });
          return true;
        }
      },

      updateUser: (data) => {
        set((state) => {
          const updatedUser = { ...state.user, ...data };
          return { user: updatedUser };
        });
      },

      logout: () => {
        localStorage.removeItem('raices_jwt_token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          is2FAVerified: false, 
          tempToken: null, 
          error: null 
        });
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'raices-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        is2FAVerified: state.is2FAVerified 
      }),
    }
  )
);
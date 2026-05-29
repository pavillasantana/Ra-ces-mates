import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      is2FAVerified: false,
      tempToken: null,
      loading: false,
      error: null,

      register: async ({ name, email, phone, password, docType, docNumber }) => {
        set({ loading: true, error: null });
        await delay(500); // Mock delay

        try {
          const users = JSON.parse(localStorage.getItem('raices_users') || '[]');
          const exists = users.find(u => u.email === email);
          if (exists) throw new Error('E-mail já cadastrado');

          const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password,
            docType: docType || 'DNI',
            docNumber: docNumber || '',
            marketingOptIn: false
          };
          users.push(newUser);
          localStorage.setItem('raices_users', JSON.stringify(users));

          set({ loading: false });
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        await delay(500); // Mock delay

        try {
          const users = JSON.parse(localStorage.getItem('raices_users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          if (!user) throw new Error('Credenciais inválidas');

          // Sempre retorna 2fa por segurança no MVP
          const fakeToken = Math.random().toString(36).substring(2);
          set({ user, tempToken: fakeToken, isAuthenticated: false, loading: false });
          return '2fa';
        } catch (error) {
          set({ error: error.message, loading: false });
          return 'error';
        }
      },

      verify2FA: async (code) => {
        set({ loading: true, error: null });
        await delay(500);

        try {
          if (!code || code.length < 4) throw new Error('Código inválido');
          
          set({ 
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

      updateUser: (data) => {
        set((state) => {
          const updatedUser = { ...state.user, ...data };

          // Opcional: Atualizar também no localStorage real do mock
          const users = JSON.parse(localStorage.getItem('raices_users') || '[]');
          const userIndex = users.findIndex(u => u.email === state.user.email);
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...data };
            localStorage.setItem('raices_users', JSON.stringify(users));
          }

          return { user: updatedUser };
        });
      },

      changePassword: ({ currentPassword, newPassword }) => {
        const state = useAuthStore.getState();
        if (!state.user || state.user.password !== currentPassword) {
          return { ok: false, message: 'Senha atual inválida.' };
        }
        state.updateUser({ password: newPassword });
        return { ok: true };
      },

      logout: () => set({ user: null, isAuthenticated: false, is2FAVerified: false, tempToken: null, error: null }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'raices-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, is2FAVerified: state.is2FAVerified, marketingOptIn: state.user?.marketingOptIn }),
    }
  )
);
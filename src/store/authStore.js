import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  is2FAVerified: false,

  login: (userData) => set({ user: userData, isAuthenticated: true, is2FAVerified: false }),
  verify2FA: () => set({ is2FAVerified: true }),
  logout: () => set({ user: null, isAuthenticated: false, is2FAVerified: false }),
}));

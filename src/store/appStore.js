import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      lang: 'es',
      setLang: (lang) => set({ lang })
    }),
    { name: 'raices-app-settings' }
  )
);

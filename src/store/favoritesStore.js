import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (product) => set((state) => {
        if (state.favorites.some((item) => item.id === product.id)) {
          return state;
        }
        return { favorites: [...state.favorites, product] };
      }),

      removeFavorite: (productId) => set((state) => ({
        favorites: state.favorites.filter((item) => item.id !== productId)
      })),

      toggleFavorite: (product) => {
        const exists = get().favorites.some((item) => item.id === product.id);
        if (exists) {
          get().removeFavorite(product.id);
          return;
        }
        get().addFavorite(product);
      },

      isFavorite: (productId) => get().favorites.some((item) => item.id === productId)
    }),
    {
      name: 'raices-favorites',
      partialize: (state) => ({ favorites: state.favorites })
    }
  )
);

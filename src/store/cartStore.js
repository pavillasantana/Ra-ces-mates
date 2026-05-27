import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      cart: [],
      isCartOpen: false,

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
            isCartOpen: true
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }], isCartOpen: true };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),

      updateQuantity: (productId, amount) => set((state) => {
        const item = state.cart.find(i => i.id === productId);
        if (item && item.quantity + amount <= 0) {
          return { cart: state.cart.filter(i => i.id !== productId) };
        }
        return {
          cart: state.cart.map(item =>
            item.id === productId
              ? { ...item, quantity: item.quantity + amount }
              : item
          )
        };
      }),

      clearCart: () => set({ cart: [] })
    }),
    {
      name: 'raices-cart',
      partialize: (state) => ({ cart: state.cart }) // Salva apenas os itens, ignora isCartOpen
    }
  )
);

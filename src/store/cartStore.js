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
        const updatedCart = state.cart.map(item => {
          if (item.id === productId) {
            const newQuantity = item.quantity + amount;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        }).filter(Boolean);
        
        return { cart: updatedCart };
      }),

      clearCart: () => set({ cart: [] })
    }),
    {
      name: 'raices-cart',
      partialize: (state) => ({ cart: state.cart })
    }
  )
);

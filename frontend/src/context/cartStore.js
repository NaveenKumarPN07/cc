/**
 * Cart Store - Zustand
 * Client-side cart state (syncs with backend for logged-in users)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],       // local cart (guest)
      serverCart: null, // synced from backend
      isLoading: false,
      totalItems: 0,

      // ─── Local Cart (guest users) ──────────────────────────────────────────

      addLocalItem: (product, quantity = 1, size = null, color = null) => {
        const { items } = get();
        const key = `${product._id}-${size}-${color}`;
        const existing = items.find(
          (i) => `${i.product._id}-${i.size}-${i.color}` === key
        );

        if (existing) {
          set({
            items: items.map((i) =>
              `${i.product._id}-${i.size}-${i.color}` === key
                ? { ...i, quantity: Math.min(10, i.quantity + quantity) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity, size, color }] });
        }
        get()._syncCount();
        toast.success('Added to cart!');
      },

      removeLocalItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (i) =>
              !(i.product._id === productId && i.size === size && i.color === color)
          ),
        });
        get()._syncCount();
      },

      updateLocalQuantity: (productId, size, color, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.product._id === productId && i.size === size && i.color === color
              ? { ...i, quantity }
              : i
          ),
        });
        get()._syncCount();
      },

      clearLocal: () => set({ items: [], totalItems: 0 }),

      // ─── Server Cart (logged-in users) ────────────────────────────────────

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const data = await cartAPI.get();
          set({ serverCart: data.cart, totalItems: data.cart.totalItems, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addToServerCart: async (productId, quantity, size, color) => {
        try {
          const result = await cartAPI.add({ productId, quantity, size, color });
          set({ totalItems: result.totalItems });
          await get().fetchCart();
          toast.success('Added to cart!');
          return { success: true };
        } catch (err) {
          toast.error(err.message);
          return { success: false };
        }
      },

      updateServerItem: async (itemId, quantity) => {
        try {
          await cartAPI.update(itemId, { quantity });
          await get().fetchCart();
        } catch (err) {
          toast.error(err.message);
        }
      },

      removeServerItem: async (itemId) => {
        try {
          await cartAPI.remove(itemId);
          await get().fetchCart();
          toast.success('Item removed');
        } catch (err) {
          toast.error(err.message);
        }
      },

      clearServerCart: async () => {
        try {
          await cartAPI.clear();
          set({ serverCart: null, totalItems: 0 });
        } catch { /* ignore */ }
      },

      // ─── Helpers ──────────────────────────────────────────────────────────

      _syncCount: () => {
        const total = get().items.reduce((sum, i) => sum + i.quantity, 0);
        set({ totalItems: total });
      },

      getLocalSubtotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.product.discountPrice || i.product.price) * i.quantity,
          0
        ),

      resetOnLogout: () => set({ serverCart: null, totalItems: 0 }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, totalItems: state.totalItems }),
    }
  )
);

export default useCartStore;

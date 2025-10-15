"use client"

import { create } from "zustand"
import type { CartLine, Product } from "@/lib/types"

type State = {
  items: CartLine[]
}
type Actions = {
  add: (product: Product, qty?: number, comment?: string) => void
  remove: (id: string) => void
  update: (id: string, qty: number, comment?: string) => void
  clear: () => void
}

export const useCartStore = create<State & Actions>((set) => ({
  items: [],
  add: (product, qty = 1, comment = "") =>
    set((s) => {
      const exists = s.items.find((i) => i.product.id === product.id)
      if (exists) {
        return {
          items: s.items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + qty, comment: comment || i.comment } : i)),
        }
      }
      return { items: [...s.items, { product, quantity: qty, comment }] }
    }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
  update: (id, qty, comment) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.product.id === id ? { ...i, quantity: Math.max(0, qty), comment: comment !== undefined ? comment : i.comment } : i))
        .filter((i) => i.quantity > 0),
    })),
  clear: () => set({ items: [] }),
}))

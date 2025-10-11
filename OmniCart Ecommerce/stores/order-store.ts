"use client"

import { create } from "zustand"
import { addBusinessDays } from "date-fns"
import type { CartLine, Order } from "@/lib/types"
import api from "@/lib/api"

type State = {
  orders: Order[]
  loading: boolean
  error: string | null
}

type Actions = {
  placeOrder: (lines: CartLine[]) => Promise<Order | null>
  fetchOrders: () => Promise<void>
  fetchOrder: (id: string) => Promise<Order | null>
  fetchMyOrders: () => Promise<void>
  getLatestOrderIdForProduct: (productId: string) => string | undefined
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<boolean>
  deleteOrder: (orderId: string) => Promise<boolean>
}

export const useOrderStore = create<State & Actions>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  placeOrder: async (lines) => {
    set({ loading: true, error: null })
    try {
      const items = lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        comment: l.comment || '',
      }))

      const response = await api.createOrder(items)
      if (response.success && response.data) {
        set((state) => ({
          orders: [response.data as Order, ...state.orders],
          loading: false
        }))
        return response.data as Order
      }
      set({ error: 'Failed to place order', loading: false })
      return null
    } catch (error) {
      console.error('Place order error:', error)
      set({ error: 'Failed to place order', loading: false })
      return null
    }
  },

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getOrders()
      if (response.success && response.data) {
        set({ orders: response.data as Order[], loading: false })
      } else {
        set({ error: 'Failed to fetch orders', loading: false })
      }
    } catch (error) {
      console.error('Fetch orders error:', error)
      set({ error: 'Failed to fetch orders', loading: false })
    }
  },

  fetchOrder: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getOrder(id)
      if (response.success && response.data) {
        set({ loading: false })
        return response.data as Order
      }
      set({ error: 'Failed to fetch order', loading: false })
      return null
    } catch (error) {
      console.error('Fetch order error:', error)
      set({ error: 'Failed to fetch order', loading: false })
      return null
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getMyOrders()
      if (response.success && response.data) {
        set({ orders: response.data as Order[], loading: false })
      } else {
        set({ error: 'Failed to fetch orders', loading: false })
      }
    } catch (error) {
      console.error('Fetch my orders error:', error)
      set({ error: 'Failed to fetch orders', loading: false })
    }
  },

  getLatestOrderIdForProduct: (productId) => {
    const orders = get().orders
    const found = orders.find((o) => o.items.some((it) => it.productId === productId))
    return found?.id
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null })
    try {
      const response = await api.updateOrderStatus(orderId, status)
      if (response.success) {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to update order status', loading: false })
      return false
    } catch (error) {
      console.error('Update order status error:', error)
      set({ error: 'Failed to update order status', loading: false })
      return false
    }
  },

  deleteOrder: async (orderId) => {
    set({ loading: true, error: null })
    try {
      const response = await api.deleteOrder(orderId)
      if (response.success) {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to delete order', loading: false })
      return false
    } catch (error) {
      console.error('Delete order error:', error)
      set({ error: 'Failed to delete order', loading: false })
      return false
    }
  },
}))

export function getEtaDate(createdAtIso: string, businessDays: number) {
  return addBusinessDays(new Date(createdAtIso), businessDays)
}

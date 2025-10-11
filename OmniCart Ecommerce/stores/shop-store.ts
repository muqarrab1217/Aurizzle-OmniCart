"use client"

import { create } from "zustand"
import type { Shop } from "@/lib/types"
import api from "@/lib/api"

type State = {
  shops: Shop[]
  loading: boolean
  error: string | null
}

type Actions = {
  fetchShops: () => Promise<void>
  fetchShop: (id: string) => Promise<Shop | null>
  createShop: (shopData: Omit<Shop, "id" | "createdAt" | "totalRevenue">) => Promise<Shop | null>
  updateShop: (id: string, shopData: Partial<Shop>) => Promise<boolean>
  deleteShop: (id: string) => Promise<boolean>
  getShopRevenue: (id: string) => Promise<number | null>
}

export const useShopStore = create<State & Actions>((set, get) => ({
  shops: [],
  loading: false,
  error: null,

  fetchShops: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getShops()
      if (response.success && response.data) {
        set({ shops: response.data, loading: false })
      } else {
        set({ error: 'Failed to fetch shops', loading: false })
      }
    } catch (error) {
      console.error('Fetch shops error:', error)
      set({ error: 'Failed to fetch shops', loading: false })
    }
  },

  fetchShop: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getShop(id)
      if (response.success && response.data) {
        set({ loading: false })
        return response.data
      }
      set({ error: 'Failed to fetch shop', loading: false })
      return null
    } catch (error) {
      console.error('Fetch shop error:', error)
      set({ error: 'Failed to fetch shop', loading: false })
      return null
    }
  },

  createShop: async (shopData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.createShop(shopData)
      if (response.success && response.data) {
        set((state) => ({
          shops: [response.data, ...state.shops],
          loading: false
        }))
        return response.data
      }
      set({ error: 'Failed to create shop', loading: false })
      return null
    } catch (error) {
      console.error('Create shop error:', error)
      set({ error: 'Failed to create shop', loading: false })
      return null
    }
  },

  updateShop: async (id, shopData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.updateShop(id, shopData)
      if (response.success) {
        set((state) => ({
          shops: state.shops.map((shop) =>
            shop.id === id ? { ...shop, ...shopData } : shop
          ),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to update shop', loading: false })
      return false
    } catch (error) {
      console.error('Update shop error:', error)
      set({ error: 'Failed to update shop', loading: false })
      return false
    }
  },

  deleteShop: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.deleteShop(id)
      if (response.success) {
        set((state) => ({
          shops: state.shops.filter((shop) => shop.id !== id),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to delete shop', loading: false })
      return false
    } catch (error) {
      console.error('Delete shop error:', error)
      set({ error: 'Failed to delete shop', loading: false })
      return false
    }
  },

  getShopRevenue: async (id) => {
    try {
      const response = await api.getShopRevenue(id)
      if (response.success && response.data) {
        return response.data.totalRevenue
      }
      return null
    } catch (error) {
      console.error('Get shop revenue error:', error)
      return null
    }
  },
}))


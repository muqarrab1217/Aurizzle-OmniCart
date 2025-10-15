"use client"

import { create } from "zustand"
import type { Product } from "@/lib/types"
import api from "@/lib/api"

type State = {
  products: Product[]
  loading: boolean
  error: string | null
}

type Actions = {
  fetchProducts: (params?: {
    shopId?: string;
    tags?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) => Promise<void>
  fetchProduct: (id: string) => Promise<Product | null>
  createProduct: (p: Omit<Product, "id">) => Promise<Product | null>
  updateProduct: (id: string, patch: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  fetchProductsByShop: (shopId: string) => Promise<void>
}

export const useProductsStore = create<State & Actions>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async (params) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getProducts(params)
      if (response.success && response.data) {
        set({ products: response.data as Product[], loading: false })
      } else {
        set({ error: 'Failed to fetch products', loading: false })
      }
    } catch (error) {
      console.error('Fetch products error:', error)
      set({ error: 'Failed to fetch products', loading: false })
    }
  },

  fetchProduct: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getProduct(id)
      if (response.success && response.data) {
        set({ loading: false })
        return response.data as Product
      }
      set({ error: 'Failed to fetch product', loading: false })
      return null
    } catch (error) {
      console.error('Fetch product error:', error)
      set({ error: 'Failed to fetch product', loading: false })
      return null
    }
  },

  createProduct: async (p) => {
    set({ loading: true, error: null })
    try {
      const response = await api.createProduct(p)
      if (response.success && response.data) {
        set((state) => ({
          products: [response.data as Product, ...state.products],
          loading: false
        }))
        return response.data as Product
      }
      set({ error: 'Failed to create product', loading: false })
      return null
    } catch (error) {
      console.error('Create product error:', error)
      set({ error: 'Failed to create product', loading: false })
      return null
    }
  },

  updateProduct: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const response = await api.updateProduct(id, patch)
      if (response.success) {
        set((state) => ({
          products: state.products.map((prod) => 
            prod.id === id ? { ...prod, ...patch } : prod
          ),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to update product', loading: false })
      return false
    } catch (error) {
      console.error('Update product error:', error)
      set({ error: 'Failed to update product', loading: false })
      return false
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.deleteProduct(id)
      if (response.success) {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          loading: false
        }))
        return true
      }
      set({ error: 'Failed to delete product', loading: false })
      return false
    } catch (error) {
      console.error('Delete product error:', error)
      set({ error: 'Failed to delete product', loading: false })
      return false
    }
  },

  fetchProductsByShop: async (shopId) => {
    set({ loading: true, error: null })
    try {
      const response = await api.getProductsByShop(shopId)
      if (response.success && response.data) {
        set({ products: response.data as Product[], loading: false })
      } else {
        set({ error: 'Failed to fetch products', loading: false })
      }
    } catch (error) {
      console.error('Fetch products by shop error:', error)
      set({ error: 'Failed to fetch products', loading: false })
    }
  },
}))

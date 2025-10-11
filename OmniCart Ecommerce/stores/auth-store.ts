"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role } from "@/lib/types"
import api from "@/lib/api"

export type User = {
  id: string
  email: string
  name: string
  role: Role
  shopId?: string // For managers
  phone?: string
  cnic?: string
  profilePhoto?: string
}

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

type AuthActions = {
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string, role?: Role) => Promise<boolean>
  logout: () => void
  setUser: (user: User) => void
  updateUserShop: (shopId: string) => void
  updateUserProfile: (profile: Partial<User>) => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        try {
          const response = await api.login(email, password)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            
            // Store token in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token)
            }
            
            set({ 
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId: user.shopId,
                phone: user.phone,
                cnic: user.cnic,
                profilePhoto: user.profilePhoto,
              }, 
              isAuthenticated: true,
              token 
            })
            return true
          }
          
          return false
        } catch (error) {
          console.error('Login error:', error)
          return false
        }
      },

      signup: async (name: string, email: string, password: string, role: Role = 'customer') => {
        try {
          const response = await api.signup(name, email, password, role)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            
            // Store token in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token)
            }
            
            set({ 
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId: user.shopId,
                phone: user.phone,
                cnic: user.cnic,
                profilePhoto: user.profilePhoto,
              }, 
              isAuthenticated: true,
              token 
            })
            return true
          }
          
          return false
        } catch (error) {
          console.error('Signup error:', error)
          return false
        }
      },

      logout: () => {
        // Remove token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        
        set({ 
          user: null, 
          isAuthenticated: false,
          token: null 
        })
      },

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true 
        })
      },

      updateUserShop: (shopId: string) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              shopId,
              role: 'manager' // Upgrade to manager when shop is created
            }
          })
        }
      },

      updateUserProfile: (profile: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...profile
            }
          })
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await api.getMe()
          
          if (response.success && response.data) {
            set({
              user: {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
                shopId: response.data.shopId,
                phone: response.data.phone,
                cnic: response.data.cnic,
                profilePhoto: response.data.profilePhoto,
              },
              isAuthenticated: true
            })
          }
        } catch (error) {
          console.error('Fetch current user error:', error)
          // If token is invalid, logout
          get().logout()
        }
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        token: state.token 
      }),
      skipHydration: false,
    }
  )
)

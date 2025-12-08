/**
 * Auth Store
 * Zustand store cho authentication state
 */

import { create } from 'zustand'
import { authService, User } from '../services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  loadUser: () => Promise<void>
  logout: () => Promise<void>
  handleOAuthCallback: () => Promise<void>
  updateSettings: (settings: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    error: null
  }),

  loadUser: async () => {
    set({ isLoading: true, error: null })
    try {
      const user = await authService.getCurrentUser()
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      })
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      })
    }
  },

  logout: async () => {
    try {
      await authService.logout()
      set({
        user: null,
        isAuthenticated: false,
        error: null
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  handleOAuthCallback: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = authService.handleOAuthCallback()
      if (token) {
        const user = await authService.getCurrentUser()
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'OAuth authentication failed'
      })
    }
  },

  updateSettings: async (settings: Partial<User>) => {
    try {
      const updatedUser = await authService.updateUserSettings(settings)
      set({ user: updatedUser, error: null })
    } catch (error: any) {
      set({ error: error.message || 'Failed to update settings' })
      throw error
    }
  }
}))

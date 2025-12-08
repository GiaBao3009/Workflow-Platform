/**
 * Auth Service
 * Xử lý authentication với backend
 */

const API_URL = 'http://localhost:3001/api'

export interface User {
  _id: string
  email: string
  name?: string
  avatar?: string
  provider?: 'local' | 'google' | 'github'
  role?: 'user' | 'admin'
  autoSaveInterval?: number // Khoảng thời gian auto-save (giây)
}

export interface AuthResponse {
  user: User
  token?: string
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token')
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Set auth token
   */
  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  /**
   * Clear auth token
   */
  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      if (!response.ok) {
        this.clearToken()
        return null
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('Error fetching user:', error)
      this.clearToken()
      return null
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearToken()
    }
  }

  /**
   * Handle OAuth callback from URL
   */
  handleOAuthCallback(): string | null {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const authStatus = params.get('auth')

    if (authStatus === 'success' && token) {
      this.setToken(token)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      return token
    }

    if (authStatus === 'failed') {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      throw new Error('OAuth authentication failed')
    }

    return null
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: Partial<User>): Promise<User> {
    const response = await fetch(`${API_URL}/auth/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(settings)
    })

    if (!response.ok) {
      throw new Error('Failed to update settings')
    }

    return response.json()
  }
}

export const authService = new AuthService()
export default authService

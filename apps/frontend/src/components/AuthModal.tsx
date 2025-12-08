import { useState } from 'react'
import './AuthModal.css'
import Logo, { LogoBox } from './Logo'
import ThemeToggle from './ThemeToggle'
import { useAuthStore } from '../store/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin?: (email: string, password: string) => void
  onRegister?: (name: string, email: string, password: string) => void
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const { user, isAuthenticated, logout, updateSettings } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [autoSaveInterval, setAutoSaveInterval] = useState(user?.autoSaveInterval || 30)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Gửi request reset password đến backend
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordSent(true)
      } else {
        setError(data.message || 'Có lỗi xảy ra')
      }
    } catch (err) {
      // Demo mode: giả lập gửi email thành công
      setForgotPasswordSent(true)
    } finally {
      setLoading(false)
    }
  }

  const resetForgotPassword = () => {
    setIsForgotPassword(false)
    setForgotPasswordSent(false)
    setForgotPasswordEmail('')
    setError('')
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    setSettingsSaved(false)
    
    try {
      await updateSettings({ autoSaveInterval })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Không thể lưu cài đặt')
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự')
          setLoading(false)
          return
        }
        onRegister?.(formData.name, formData.email, formData.password)
        // Demo: show success
        alert('🎉 Đăng ký thành công! Vui lòng đăng nhập.')
        setIsSignUp(false)
        setFormData({ ...formData, name: '', confirmPassword: '' })
      } else {
        onLogin?.(formData.email, formData.password)
        // Demo: show success
        alert('✅ Đăng nhập thành công!')
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // Redirect to backend OAuth endpoint
    const backendUrl = 'http://localhost:3001'
    window.location.href = `${backendUrl}/api/auth/${provider}`
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className={`auth-modal ${isSignUp ? 'sign-up-mode' : ''} ${isAuthenticated && user ? 'profile-mode' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="auth-close-btn" onClick={onClose}>✕</button>

        {/* If authenticated, show user profile */}
        {isAuthenticated && user ? (
          <div className="user-profile-container">
            {/* Background decoration */}
            <div className="profile-bg-decoration">
              <div className="profile-bg-circle"></div>
              <div className="profile-bg-circle-2"></div>
            </div>

            {/* Avatar - positioned absolute */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="profile-avatar-ring"></div>
                <div className="profile-status-dot"></div>
              </div>
            </div>

            <div className="profile-info-section">
              <h2 className="profile-name">{user.name || 'User'}</h2>
              <p className="profile-email">{user.email}</p>
              
              {user.provider && (
                <div className="profile-badge">
                  {user.provider === 'google' ? (
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                  <span>{user.provider === 'google' ? 'Google' : 'GitHub'}</span>
                </div>
              )}
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <span className="stat-value">--</span>
                  <span className="stat-label">Workflows</span>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <span className="stat-value">--</span>
                  <span className="stat-label">Runs</span>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-value">Active</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            </div>

            {/* Settings Toggle */}
            <button 
              className={`settings-toggle ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Cài đặt
              <svg className="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Collapsible Settings */}
            {showSettings && (
              <div className="profile-settings">
                {/* Theme Selector */}
                <div className="setting-item">
                  <div className="setting-header">
                    <label>Giao diện</label>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="setting-divider"></div>

                {/* Auto-save Setting */}
                <div className="setting-item">
                  <div className="setting-header">
                    <label htmlFor="autoSaveInterval">Tự động lưu</label>
                    <span className="setting-value">{autoSaveInterval}s</span>
                  </div>
                  <input 
                    type="range"
                    id="autoSaveInterval"
                    min="3"
                    max="60"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                    className="setting-slider"
                  />
                  <div className="setting-range-labels">
                    <span>3s</span>
                    <span>30s</span>
                    <span>60s</span>
                  </div>
                </div>

                <button 
                  className="btn-save-settings"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                >
                  {settingsSaving ? (
                    <span>Đang lưu...</span>
                  ) : settingsSaved ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Đã lưu!
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            )}

            <div className="profile-actions">
              <button className="btn-profile-secondary" onClick={onClose}>
                Đóng
              </button>
              <button className="btn-profile-logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng Xuất
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Forgot Password Form */}
            {isForgotPassword ? (
              <div className="auth-forms-container">
                <div className="auth-form-wrapper">
                  <form onSubmit={handleForgotPassword} className="auth-form">
                    <div className="auth-form-header">
                      <div className="forgot-icon">🔐</div>
                      <h2>{forgotPasswordSent ? 'Kiểm tra email!' : 'Quên mật khẩu?'}</h2>
                      <p>
                        {forgotPasswordSent 
                          ? 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.'
                          : 'Nhập email của bạn để nhận link đặt lại mật khẩu'
                        }
                      </p>
                    </div>

                    {error && (
                      <div className="auth-error">
                        <span>⚠️</span> {error}
                      </div>
                    )}

                    {forgotPasswordSent ? (
                      <div className="forgot-success">
                        <div className="success-icon-circle">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <p>
                          Email đã được gửi đến <strong>{forgotPasswordEmail}</strong>
                        </p>
                        <p className="success-hint">
                          Vui lòng kiểm tra hộp thư (bao gồm cả thư mục spam) và làm theo hướng dẫn.
                        </p>
                        <button 
                          type="button" 
                          className="auth-submit-btn"
                          onClick={resetForgotPassword}
                        >
                          Quay lại đăng nhập
                          <span className="btn-arrow">→</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="auth-input-group">
                          <label>Email</label>
                          <div className="input-wrapper">
                            <span className="input-icon">📧</span>
                            <input
                              type="email"
                              placeholder="your@email.com"
                              value={forgotPasswordEmail}
                              onChange={e => setForgotPasswordEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner"></span>
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              Gửi link đặt lại mật khẩu
                              <span className="btn-arrow">→</span>
                            </>
                          )}
                        </button>

                        <button 
                          type="button" 
                          className="back-to-login"
                          onClick={resetForgotPassword}
                        >
                          ← Quay lại đăng nhập
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </div>
            ) : (
            <>
            {/* Forms Container */}
            <div className="auth-forms-container">
          {/* Sign In Form */}
          <div className={`auth-form-wrapper sign-in-wrapper ${isSignUp ? 'hide' : ''}`}>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-header">
                <LogoBox size={60} />
                <h2>Chào mừng trở lại!</h2>
                <p>Đăng nhập để tiếp tục với Workflow Platform</p>
              </div>

              {error && !isSignUp && (
                <div className="auth-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="auth-social-buttons">
                <button type="button" className="social-btn google" onClick={() => handleSocialLogin('google')}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button type="button" className="social-btn github" onClick={() => handleSocialLogin('github')}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="auth-divider">
                <span>hoặc đăng nhập bằng email</span>
              </div>

              <div className="auth-input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Mật khẩu</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button 
                  type="button" 
                  className="forgot-password"
                  onClick={() => { setIsForgotPassword(true); setError('') }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>

              <p className="auth-switch">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => { setIsSignUp(true); setError('') }}>
                  Đăng ký ngay
                </button>
              </p>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className={`auth-form-wrapper sign-up-wrapper ${isSignUp ? '' : 'hide'}`}>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-header">
                <div className="auth-logo-box signup">
                  <Logo size={36} variant="white" />
                </div>
                <h2>Tạo tài khoản mới</h2>
                <p>Bắt đầu tự động hóa workflow của bạn</p>
              </div>

              {error && isSignUp && (
                <div className="auth-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="auth-input-group">
                <label>Họ và tên</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Mật khẩu</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔐</span>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-terms">
                <label>
                  <input type="checkbox" required />
                  <span>
                    Tôi đồng ý với{' '}
                    <a href="#">Điều khoản dịch vụ</a> và{' '}
                    <a href="#">Chính sách bảo mật</a>
                  </span>
                </label>
              </div>

              <button type="submit" className="auth-submit-btn signup" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tạo tài khoản
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>

              <p className="auth-switch">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => { setIsSignUp(false); setError('') }}>
                  Đăng nhập
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Decorative Panel */}
        <div className={`auth-panel ${isSignUp ? 'panel-left' : 'panel-right'}`}>
          <div className="panel-content">
            <div className="panel-illustration">
              <Logo size={80} variant="white" />
            </div>
            <h3>{isSignUp ? 'Đã có tài khoản?' : 'Mới đến đây?'}</h3>
            <p>
              {isSignUp 
                ? 'Đăng nhập để tiếp tục quản lý các workflow của bạn'
                : 'Đăng ký để khám phá sức mạnh của tự động hóa workflow'}
            </p>
            <button 
              className="panel-btn"
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            >
              {isSignUp ? 'Đăng nhập' : 'Đăng ký miễn phí'}
            </button>
            
            <div className="panel-features">
              <div className="feature">
                <span>✓</span> Không cần thẻ tín dụng
              </div>
              <div className="feature">
                <span>✓</span> Miễn phí dùng 
              </div>
              <div className="feature">
                <span>✓</span> Hỗ trợ 24/7
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="panel-bg-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        </>
        )}
        </>
        )}
      </div>
    </div>
  )
}


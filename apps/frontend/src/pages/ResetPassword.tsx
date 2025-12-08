import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './ResetPassword.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    } else {
      setError('Token không hợp lệ')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } else {
        setError(data.message || 'Token đã hết hạn hoặc không hợp lệ')
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        {success ? (
          <div className="reset-success">
            <div className="success-icon">✓</div>
            <h1>Đặt lại thành công! 🎉</h1>
            <p>Mật khẩu của bạn đã được cập nhật.</p>
            <p>Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.</p>
            <div className="redirect-hint">⏳ Đang chuyển hướng về trang chủ...</div>
          </div>
        ) : (
          <>
            <div className="reset-header">
              <div className="logo-container">
                <span className="logo-icon">🔐</span>
              </div>
              <h1>Đặt lại mật khẩu</h1>
              <p>Tạo mật khẩu mới để bảo vệ tài khoản của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="reset-form">
              {error && (
                <div className="reset-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="input-group">
                <label>Mật khẩu mới</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔐</span>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="reset-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đặt lại mật khẩu
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>

              <button 
                type="button" 
                className="back-to-home"
                onClick={() => navigate('/')}
              >
                ← Quay về trang chủ
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

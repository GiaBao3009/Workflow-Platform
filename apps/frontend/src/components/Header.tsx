import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Header.css'
import AuthModal from './AuthModal'
import Logo from './Logo'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const [showGuide, setShowGuide] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  const isAdmin = user?.role === 'admin'
  const isAdminPage = location.pathname === '/admin'


  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Logo size={36} variant="gradient" />
            <div className="header-titles">
              <h1>Workflow Platform</h1>
              <p className="subtitle">Tự động hóa quy trình công việc</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          {isAdmin && (
            <button 
              className={`btn ${isAdminPage ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => navigate(isAdminPage ? '/' : '/admin')}
            >
              {isAdminPage ? '👤 Chế Độ Người Dùng' : '⚙️ Quản Trị'}
            </button>
          )}
          
          <button className="btn btn-secondary" onClick={() => setShowGuide(true)}>
            📚 Hướng Dẫn
          </button>
          
          {isAuthenticated && user ? (
            <div className="user-menu">
              <button className="btn btn-user" onClick={() => setShowAuth(true)}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{user.name || user.email}</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
              🔐 Đăng Nhập
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)}
        onLogin={(email, password) => {
          console.log('Login:', email, password)
        }}
        onRegister={(name, email, password) => {
          console.log('Register:', name, email, password)
        }}
      />

      {showGuide && (
        <div className="guide-modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h2>📚 Hướng Dẫn Sử Dụng</h2>
              <button className="close-btn" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            
            <div className="guide-content">
              <section className="guide-section">
                <h3>🚀 Bắt đầu nhanh</h3>
                <ol>
                  <li><strong>Tạo Workflow mới:</strong> Click "➕ Tạo Workflow Mới" ở sidebar bên trái</li>
                  <li><strong>Thêm các node:</strong> Kéo thả các khối từ palette vào canvas</li>
                  <li><strong>Kết nối node:</strong> Kéo từ điểm output của node này đến input của node khác</li>
                  <li><strong>Cấu hình node:</strong> Click vào node để mở panel cấu hình</li>
                  <li><strong>Lưu & Xuất bản:</strong> Click "💾 Lưu" rồi "🚀 Xuất Bản"</li>
                  <li><strong>Chạy thử:</strong> Click "▶️ Chạy Thử" để test workflow</li>
                </ol>
              </section>

              <section className="guide-section">
                <h3>🧩 Các loại Node</h3>
                <div className="node-types-grid">
                  <div className="node-type-item">
                    <span className="node-icon">🌐</span>
                    <div>
                      <strong>HTTP Request</strong>
                      <p>Gọi API bên ngoài (GET, POST, PUT, DELETE)</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">💾</span>
                    <div>
                      <strong>Database</strong>
                      <p>Đọc/ghi dữ liệu MongoDB</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">✈️</span>
                    <div>
                      <strong>Telegram</strong>
                      <p>Gửi tin nhắn qua Telegram Bot</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">🤖</span>
                    <div>
                      <strong>ChatGPT / Gemini</strong>
                      <p>Tích hợp AI để xử lý văn bản</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">🛡️</span>
                    <div>
                      <strong>Lọc Nội Dung</strong>
                      <p>Kiểm tra từ khóa nhạy cảm</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">🔀</span>
                    <div>
                      <strong>Điều kiện</strong>
                      <p>Rẽ nhánh theo điều kiện if/else</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">⏰</span>
                    <div>
                      <strong>Delay</strong>
                      <p>Tạm dừng workflow một khoảng thời gian</p>
                    </div>
                  </div>
                  <div className="node-type-item">
                    <span className="node-icon">📧</span>
                    <div>
                      <strong>Email</strong>
                      <p>Gửi email tự động</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="guide-section">
                <h3>🔗 Sử dụng biến động</h3>
                <p>Bạn có thể sử dụng output từ node trước bằng cú pháp:</p>
                <code className="code-block">{`{{nodeId.field}}`}</code>
                <p>Ví dụ:</p>
                <ul>
                  <li><code>{`{{http-123.data.name}}`}</code> - Lấy field name từ response HTTP</li>
                  <li><code>{`{{telegram-456.message}}`}</code> - Lấy tin nhắn từ Telegram</li>
                  <li><code>{`{{gemini-789.response}}`}</code> - Lấy response từ Gemini AI</li>
                </ul>
              </section>

              <section className="guide-section">
                <h3>📅 Lịch chạy tự động</h3>
                <p>Thiết lập workflow chạy tự động theo lịch:</p>
                <ul>
                  <li>Chuyển sang tab "Lịch chạy" ở panel phải</li>
                  <li>Click "+ Tạo lịch mới"</li>
                  <li>Chọn CRON expression hoặc dùng mẫu có sẵn</li>
                </ul>
              </section>

              <section className="guide-section">
                <h3>🔔 Webhooks</h3>
                <p>Tạo URL webhook để trigger workflow từ bên ngoài:</p>
                <ul>
                  <li>Chuyển sang tab "Webhooks" ở panel phải</li>
                  <li>Click "+ Tạo Webhook"</li>
                  <li>Copy URL và sử dụng trong service khác (Telegram, GitHub, etc.)</li>
                </ul>
              </section>

              <section className="guide-section">
                <h3>💡 Mẹo hay</h3>
                <ul>
                  <li>Workflow tự động lưu sau 2 giây không thao tác</li>
                  <li>Nhấn Delete để xóa node/connection đang chọn</li>
                  <li>Click vào tên workflow để đổi tên</li>
                  <li>Xem lịch sử chạy ở tab "Lịch sử" để debug</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import WorkflowCanvas from './components/WorkflowCanvas'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import { useWorkflowStore } from './store/workflowStore'
import { useAuthStore } from './store/authStore'
import './App.css'

// ID người dùng tạm (sau này sẽ lấy từ authentication)
const TEMP_USER_ID = 'user-demo-123'

function App() {
  const { fetchWorkflows, workflows, currentWorkflow, setCurrentWorkflow } = useWorkflowStore()
  const { loadUser, handleOAuthCallback, user } = useAuthStore()

  useEffect(() => {
    // Xử lý OAuth callback nếu có
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('token') || urlParams.get('auth')) {
      handleOAuthCallback()
    } else {
      // Load user hiện tại từ token
      loadUser()
    }
  }, [handleOAuthCallback, loadUser])

  useEffect(() => {
    // Tải workflows khi app khởi động
    // Sử dụng user._id nếu đã đăng nhập, nếu không dùng TEMP_USER_ID
    const userId = user?._id || TEMP_USER_ID
    console.log('📊 Fetching workflows for userId:', userId)
    console.log('👤 Current user:', user)
    fetchWorkflows(userId)
  }, [fetchWorkflows, user])

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Admin Dashboard - Chỉ admin mới truy cập được */}
      <Route path="/admin" element={
        <div className="app">
          <Header />
          <AdminDashboard />
        </div>
      } />
      
      {/* User Workflow Page */}
      <Route path="/" element={
        <div className="app">
          <Header />
          <div className="app-container">
            <Sidebar 
              workflows={workflows}
              onSelectWorkflow={setCurrentWorkflow}
            />
            <main className="main-content">
              <WorkflowCanvas 
                workflow={currentWorkflow}
              />
            </main>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App

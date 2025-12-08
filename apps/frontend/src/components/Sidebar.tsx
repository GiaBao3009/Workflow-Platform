import { useState } from 'react'
import { useWorkflowStore } from '../store/workflowStore'
import { useAuthStore } from '../store/authStore'
import './Sidebar.css'

interface SidebarProps {
  workflows: any[]
  onSelectWorkflow: (workflow: any) => void
}

const TEMP_USER_ID = 'user-demo-123'

export default function Sidebar({ workflows, onSelectWorkflow }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'workflows' | 'library'>('workflows')
  const { createWorkflow, deleteWorkflow, currentWorkflow } = useWorkflowStore()
  const { user, isAuthenticated } = useAuthStore()

  const handleCreateNew = async () => {
    // Use authenticated user ID if available, otherwise use temp ID
    const userId = isAuthenticated && user ? user._id : TEMP_USER_ID
    
    console.log('🔐 Creating workflow with userId:', userId)
    console.log('📝 User data:', user)
    console.log('✅ Is authenticated:', isAuthenticated)
    
    const newWorkflow = {
      userId,
      name: `Workflow mới ${workflows.length + 1}`,
      description: 'Mô tả workflow',
      status: 'draft' as const,
      triggerType: 'MANUAL' as const,
      reactFlowData: {
        nodes: [
          {
            id: 'start-1',
            type: 'input',
            data: { label: '🚀 Bắt Đầu' },
            position: { x: 250, y: 50 },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    }
    
    await createWorkflow(newWorkflow)
  }

  const handleDeleteWorkflow = async (e: React.MouseEvent, workflowId: string, workflowName: string) => {
    e.stopPropagation() // Ngăn không cho click vào workflow-item
    if (window.confirm(`Bạn có chắc muốn xóa workflow "${workflowName}"?`)) {
      try {
        await deleteWorkflow(workflowId)
      } catch (error) {
        console.error('Lỗi khi xóa workflow:', error)
        alert('Không thể xóa workflow. Vui lòng thử lại.')
      }
    }
  }

  const handleCreateFromTemplate = async (templateType: string) => {
    const userId = isAuthenticated && user ? user._id : TEMP_USER_ID
    
    let templateWorkflow
    
    switch (templateType) {
      case 'send-email':
        templateWorkflow = {
          userId,
          name: '📧 Gửi Email Tự Động',
          description: 'Workflow gửi email tự động với template',
          status: 'draft' as const,
          triggerType: 'MANUAL' as const,
          reactFlowData: {
            nodes: [
              {
                id: 'start-1',
                type: 'input',
                data: { label: '🚀 Bắt Đầu' },
                position: { x: 100, y: 50 },
              },
              {
                id: 'node-1',
                type: 'email',
                data: {
                  to: 'user@example.com',
                  subject: 'Thông báo từ hệ thống',
                  body: 'Xin chào,\n\nĐây là email tự động từ workflow.\n\nTrân trọng!'
                },
                position: { x: 100, y: 180 },
              },
              {
                id: 'end-1',
                type: 'output',
                data: { label: '✅ Hoàn Thành' },
                position: { x: 100, y: 340 },
              },
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'node-1', animated: true },
              { id: 'e2', source: 'node-1', target: 'end-1', animated: true },
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        }
        break

      case 'telegram-bot':
        templateWorkflow = {
          userId,
          name: '🤖 Telegram Bot AI',
          description: 'Bot Telegram tự động trả lời với AI',
          status: 'draft' as const,
          triggerType: 'WEBHOOK' as const,
          reactFlowData: {
            nodes: [
              {
                id: 'start-1',
                type: 'input',
                data: { label: '📱 Webhook Telegram' },
                position: { x: 100, y: 50 },
              },
              {
                id: 'node-1',
                type: 'contentFilter',
                data: {
                  inputText: '{{message.text}}',
                  keywords: ['spam', 'scam', 'phishing'],
                  rejectionMessage: '⚠️ Nội dung không phù hợp'
                },
                position: { x: 100, y: 180 },
              },
              {
                id: 'node-2',
                type: 'chatgpt',
                data: {
                  model: 'gpt-4',
                  userMessage: '{{message.text}}',
                  systemPrompt: 'Bạn là trợ lý AI thông minh và thân thiện'
                },
                position: { x: 100, y: 340 },
              },
              {
                id: 'node-3',
                type: 'telegram',
                data: {
                  chatId: '{{message.chat.id}}',
                  text: '{{ai.response}}',
                  parseMode: 'Markdown'
                },
                position: { x: 100, y: 500 },
              },
              {
                id: 'end-1',
                type: 'output',
                data: { label: '✅ Hoàn Thành' },
                position: { x: 100, y: 660 },
              },
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'node-1', animated: true },
              { id: 'e2', source: 'node-1', target: 'node-2', sourceHandle: 'pass', animated: true },
              { id: 'e3', source: 'node-2', target: 'node-3', animated: true },
              { id: 'e4', source: 'node-3', target: 'end-1', animated: true },
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        }
        break

      case 'database-sync':
        templateWorkflow = {
          userId,
          name: '💾 Đồng Bộ Database',
          description: 'Đồng bộ dữ liệu giữa MongoDB và Google Sheets',
          status: 'draft' as const,
          triggerType: 'CRON' as const,
          reactFlowData: {
            nodes: [
              {
                id: 'start-1',
                type: 'input',
                data: { label: '⏰ Chạy Định Kỳ (Mỗi ngày 9AM)' },
                position: { x: 100, y: 50 },
              },
              {
                id: 'node-1',
                type: 'database',
                data: {
                  operation: 'QUERY',
                  table: 'users',
                  query: '{ "active": true, "createdAt": { "$gte": "{{yesterday}}" } }'
                },
                position: { x: 100, y: 180 },
              },
              {
                id: 'node-2',
                type: 'googleSheets',
                data: {
                  action: 'APPEND',
                  sheetName: 'Users Report',
                  range: 'A:D',
                },
                position: { x: 100, y: 340 },
              },
              {
                id: 'node-3',
                type: 'email',
                data: {
                  to: 'admin@example.com',
                  subject: '📊 Báo cáo đồng bộ dữ liệu',
                  body: 'Đã đồng bộ {{count}} users mới vào Google Sheets'
                },
                position: { x: 100, y: 500 },
              },
              {
                id: 'end-1',
                type: 'output',
                data: { label: '✅ Hoàn Thành' },
                position: { x: 100, y: 660 },
              },
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'node-1', animated: true },
              { id: 'e2', source: 'node-1', target: 'node-2', animated: true },
              { id: 'e3', source: 'node-2', target: 'node-3', animated: true },
              { id: 'e4', source: 'node-3', target: 'end-1', animated: true },
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        }
        break

      case 'api-webhook':
        templateWorkflow = {
          userId,
          name: '🌐 API Webhook Handler',
          description: 'Xử lý webhook từ API bên ngoài',
          status: 'draft' as const,
          triggerType: 'WEBHOOK' as const,
          reactFlowData: {
            nodes: [
              {
                id: 'start-1',
                type: 'input',
                data: { label: '🔔 Webhook Trigger' },
                position: { x: 100, y: 50 },
              },
              {
                id: 'node-1',
                type: 'conditional',
                data: {
                  condition: '{{event.type}}',
                  operator: 'equals',
                  value: 'payment.success'
                },
                position: { x: 100, y: 180 },
              },
              {
                id: 'node-2',
                type: 'httpRequest',
                data: {
                  method: 'POST',
                  url: 'https://api.example.com/process-payment',
                  headers: { 'Content-Type': 'application/json' },
                  body: '{{event.data}}'
                },
                position: { x: 100, y: 340 },
              },
              {
                id: 'node-3',
                type: 'database',
                data: {
                  operation: 'INSERT',
                  table: 'transactions',
                  data: '{{response}}'
                },
                position: { x: 100, y: 500 },
              },
              {
                id: 'node-4',
                type: 'email',
                data: {
                  to: '{{customer.email}}',
                  subject: '✅ Thanh toán thành công',
                  body: 'Cảm ơn bạn đã thanh toán. Mã giao dịch: {{transaction.id}}'
                },
                position: { x: 100, y: 660 },
              },
              {
                id: 'end-1',
                type: 'output',
                data: { label: '✅ Hoàn Thành' },
                position: { x: 100, y: 820 },
              },
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'node-1', animated: true },
              { id: 'e2', source: 'node-1', target: 'node-2', sourceHandle: 'true', animated: true },
              { id: 'e3', source: 'node-2', target: 'node-3', animated: true },
              { id: 'e4', source: 'node-3', target: 'node-4', animated: true },
              { id: 'e5', source: 'node-4', target: 'end-1', animated: true },
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        }
        break

      default:
        return
    }
    
    await createWorkflow(templateWorkflow)
    setActiveTab('workflows') // Switch to workflows tab after creating
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          📋 Workflow của tôi
        </button>
        <button 
          className={`tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 Thư viện
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'workflows' ? (
          <div className="workflow-list">
            <button 
              className="btn btn-primary btn-block mb-3"
              onClick={handleCreateNew}
            >
              ➕ Tạo Workflow Mới
            </button>
            
            {workflows.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có workflow nào</p>
                <small>Nhấn "Tạo Workflow Mới" để bắt đầu</small>
              </div>
            ) : (
              workflows.map((wf: any) => (
                <div 
                  key={wf._id}
                  className={`workflow-item ${currentWorkflow?._id === wf._id ? 'active' : ''}`}
                  onClick={() => onSelectWorkflow(wf)}
                >
                  <div className="workflow-item-content">
                    <h4>{wf.name}</h4>
                    <span className={`status status-${wf.status}`}>
                      {wf.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}
                    </span>
                  </div>
                  <button 
                    className="btn-delete-workflow"
                    onClick={(e) => handleDeleteWorkflow(e, wf._id, wf.name)}
                    title="Xóa workflow"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="library-list">
            <h3 className="library-title">📚 Mẫu Workflow</h3>
            <p className="library-subtitle">Chọn mẫu để bắt đầu nhanh</p>
            
            <div className="template-item" onClick={() => handleCreateFromTemplate('send-email')}>
              <div className="template-icon">📧</div>
              <div className="template-content">
                <h4>Gửi Email Tự Động</h4>
                <p>Tạo và gửi email với template tùy chỉnh</p>
                <div className="template-tags">
                  <span className="tag">Email</span>
                  <span className="tag">Automation</span>
                </div>
              </div>
            </div>

            <div className="template-item" onClick={() => handleCreateFromTemplate('telegram-bot')}>
              <div className="template-icon">🤖</div>
              <div className="template-content">
                <h4>Telegram Bot AI</h4>
                <p>Bot tự động trả lời với ChatGPT và lọc nội dung</p>
                <div className="template-tags">
                  <span className="tag">Telegram</span>
                  <span className="tag">AI</span>
                  <span className="tag">Chatbot</span>
                </div>
              </div>
            </div>

            <div className="template-item" onClick={() => handleCreateFromTemplate('database-sync')}>
              <div className="template-icon">💾</div>
              <div className="template-content">
                <h4>Đồng Bộ Database</h4>
                <p>Tự động đồng bộ dữ liệu giữa các database</p>
                <div className="template-tags">
                  <span className="tag">Database</span>
                  <span className="tag">Sync</span>
                  <span className="tag">Scheduled</span>
                </div>
              </div>
            </div>

            <div className="template-item" onClick={() => handleCreateFromTemplate('api-webhook')}>
              <div className="template-icon">🌐</div>
              <div className="template-content">
                <h4>API Webhook Handler</h4>
                <p>Nhận và xử lý webhook từ API bên ngoài</p>
                <div className="template-tags">
                  <span className="tag">Webhook</span>
                  <span className="tag">API</span>
                  <span className="tag">Integration</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

import axios from 'axios'

const API_URL = 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Workflow {
  _id?: string
  userId: string
  name: string
  description?: string
  status: 'draft' | 'published'
  triggerType: 'MANUAL' | 'WEBHOOK' | 'CRON'
  reactFlowData: {
    nodes: any[]
    edges: any[]
    viewport: { x: number; y: number; zoom: number }
  }
}

export interface WorkflowRun {
  _id: string
  workflowId: string
  temporalWorkflowId: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILURE'
  startTime: string
  endTime?: string
}

// API Workflows
export const workflowApi = {
  // Tạo workflow mới
  create: async (workflow: Workflow) => {
    const response = await api.post('/api/workflows', workflow)
    return response.data
  },

  // Lấy danh sách workflows
  getAll: async (userId: string) => {
    const response = await api.get(`/api/workflows?userId=${userId}`)
    return response.data
  },

  // Lấy chi tiết workflow
  getById: async (workflowId: string) => {
    const response = await api.get(`/api/workflows/${workflowId}`)
    return response.data
  },

  // Cập nhật workflow
  update: async (workflowId: string, updates: Partial<Workflow>) => {
    const response = await api.put(`/api/workflows/${workflowId}`, updates)
    return response.data
  },

  // Xuất bản workflow
  publish: async (workflowId: string) => {
    const response = await api.post(`/api/workflows/${workflowId}/publish`)
    return response.data
  },

  // Thực thi workflow
  execute: async (workflowId: string, inputData?: any) => {
    const response = await api.post(`/api/workflows/${workflowId}/execute`, { inputData })
    return response.data
  },

  // Lấy lịch sử chạy
  getRuns: async (workflowId: string) => {
    const response = await api.get(`/api/workflows/${workflowId}/runs`)
    return response.data
  },

  // Lấy chi tiết run
  getRunDetail: async (runId: string) => {
    const response = await api.get(`/api/workflow-runs/${runId}`)
    return response.data
  },

  // Delete workflow
  delete: async (workflowId: string) => {
    const response = await api.delete(`/api/workflows/${workflowId}`)
    return response.data
  },

  // Schedule Management
  getSchedules: async (workflowId: string) => {
    const response = await api.get(`/api/workflows/${workflowId}/schedules`)
    return response.data
  },

  createSchedule: async (workflowId: string, scheduleData: {
    name: string
    description?: string
    cronExpression: string
    timezone?: string
    triggerContext?: any
  }) => {
    const response = await api.post(`/api/workflows/${workflowId}/schedules`, scheduleData)
    return response.data
  },

  pauseSchedule: async (scheduleId: string) => {
    const response = await api.post(`/api/schedules/${scheduleId}/pause`)
    return response.data
  },

  resumeSchedule: async (scheduleId: string) => {
    const response = await api.post(`/api/schedules/${scheduleId}/resume`)
    return response.data
  },

  deleteSchedule: async (scheduleId: string) => {
    const response = await api.delete(`/api/schedules/${scheduleId}`)
    return response.data
  },

  // Webhook management
  getWebhooks: async (workflowId: string) => {
    const response = await api.get(`/api/workflows/${workflowId}/webhooks`)
    return response.data
  },

  createWebhook: async (workflowId: string, webhookData: any) => {
    const response = await api.post(`/api/workflows/${workflowId}/webhooks`, webhookData)
    return response.data
  },

  pauseWebhook: async (webhookId: string) => {
    const response = await api.post(`/api/webhooks/${webhookId}/pause`)
    return response.data
  },

  resumeWebhook: async (webhookId: string) => {
    const response = await api.post(`/api/webhooks/${webhookId}/resume`)
    return response.data
  },

  deleteWebhook: async (webhookId: string) => {
    const response = await api.delete(`/api/webhooks/${webhookId}`)
    return response.data
  },

  getWebhookLogs: async (webhookId: string, limit = 50) => {
    const response = await api.get(`/api/webhooks/${webhookId}/logs?limit=${limit}`)
    return response.data
  },
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api

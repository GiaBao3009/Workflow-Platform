import { create } from 'zustand'
import { Workflow, workflowApi } from '../services/api'

interface WorkflowState {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  loading: boolean
  error: string | null

  // Actions
  fetchWorkflows: (userId: string) => Promise<void>
  createWorkflow: (workflow: Workflow) => Promise<void>
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<void>
  setCurrentWorkflow: (workflow: Workflow | null) => void
  publishWorkflow: (workflowId: string) => Promise<void>
  executeWorkflow: (workflowId: string, inputData?: any) => Promise<any>
  deleteWorkflow: (workflowId: string) => Promise<void>
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,

  fetchWorkflows: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const data = await workflowApi.getAll(userId)
      set({ workflows: data.workflows, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createWorkflow: async (workflow: Workflow) => {
    set({ loading: true, error: null })
    try {
      const data = await workflowApi.create(workflow)
      const newWorkflow = data.workflow
      set(state => ({
        workflows: [...state.workflows, newWorkflow],
        currentWorkflow: newWorkflow,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateWorkflow: async (workflowId: string, updates: Partial<Workflow>) => {
    set({ loading: true, error: null })
    try {
      const data = await workflowApi.update(workflowId, updates)
      set(state => ({
        workflows: state.workflows.map(wf =>
          wf._id === workflowId ? data.workflow : wf
        ),
        currentWorkflow: data.workflow,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  setCurrentWorkflow: (workflow: Workflow | null) => {
    set({ currentWorkflow: workflow })
  },

  publishWorkflow: async (workflowId: string) => {
    set({ loading: true, error: null })
    try {
      await workflowApi.publish(workflowId)
      set(state => ({
        workflows: state.workflows.map(wf =>
          wf._id === workflowId ? { ...wf, status: 'published' } : wf
        ),
        currentWorkflow: state.currentWorkflow?._id === workflowId
          ? { ...state.currentWorkflow, status: 'published' }
          : state.currentWorkflow,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  executeWorkflow: async (workflowId: string, inputData?: any) => {
    set({ loading: true, error: null })
    try {
      const data = await workflowApi.execute(workflowId, inputData)
      set({ loading: false })
      return data
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteWorkflow: async (workflowId: string) => {
    set({ loading: true, error: null })
    try {
      await workflowApi.delete(workflowId)
      set(state => ({
        workflows: state.workflows.filter(wf => wf._id !== workflowId),
        currentWorkflow: state.currentWorkflow?._id === workflowId ? null : state.currentWorkflow,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))

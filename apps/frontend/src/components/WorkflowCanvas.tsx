import { useCallback, useState, useRef, DragEvent, useEffect, ChangeEvent } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './WorkflowCanvas.css'
import { useWorkflowStore } from '../store/workflowStore'
import { useAuthStore } from '../store/authStore'
import {
  HttpRequestNode,
  DatabaseNode,
  EmailNode,
  DelayNode,
  ConditionalNode,
  TelegramNode,
  ChatGPTNode,
  GeminiNode,
  ContentFilterNode,
  GoogleSheetsNode,
} from './nodes/CustomNodes'
import NodeConfigPanel from './NodeConfigPanel'
import ExecutionHistory from './ExecutionHistory'
import ScheduleManager from './ScheduleManager'
import WebhookManager from './WebhookManager'

const nodeTypes = {
  httpRequest: HttpRequestNode,
  database: DatabaseNode,
  email: EmailNode,
  delay: DelayNode,
  conditional: ConditionalNode,
  telegram: TelegramNode,
  chatgpt: ChatGPTNode,
  gemini: GeminiNode,
  contentFilter: ContentFilterNode,
  googleSheets: GoogleSheetsNode,
}

interface WorkflowCanvasProps {
  workflow: any
}

export default function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  const { updateWorkflow, publishWorkflow, executeWorkflow } = useWorkflowStore()
  const { user } = useAuthStore()
  const [executing, setExecuting] = useState(false)
  const [rightPanelView, setRightPanelView] = useState<'history' | 'schedules' | 'webhooks'>('history')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const executionHistoryRef = useRef<any>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [workflowName, setWorkflowName] = useState(workflow?.name || '')

  const initialNodes: Node[] = workflow?.reactFlowData?.nodes || [
    {
      id: 'start',
      type: 'input',
      data: { label: '🚀 Bắt Đầu' },
      position: { x: 250, y: 50 },
    },
  ]

  const initialEdges: Edge[] = workflow?.reactFlowData?.edges || []

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Get user's auto-save interval (default 30 seconds)
  const autoSaveIntervalMs = (user?.autoSaveInterval || 30) * 1000

  // Refs to store latest values without triggering re-renders
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  
  // Keep refs updated
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])
  
  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  // Auto-save workflow to backend (debounced) - uses refs to avoid dependency on nodes/edges
  const saveWorkflow = useCallback(() => {
    if (!workflow?._id) {
      console.log('⚠️ No workflow ID, skipping auto-save');
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: save after user-configured interval
    saveTimeoutRef.current = setTimeout(async () => {
      console.log(`💾 Auto-saving workflow (interval: ${user?.autoSaveInterval || 30}s)...`);
      try {
        await updateWorkflow(workflow._id, {
          reactFlowData: {
            nodes: nodesRef.current,
            edges: edgesRef.current,
            viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
          }
        });
        console.log('✅ Workflow saved');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, autoSaveIntervalMs);
  }, [workflow?._id, reactFlowInstance, updateWorkflow, autoSaveIntervalMs, user?.autoSaveInterval]);

  // Auto-save when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveWorkflow();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, saveWorkflow]);

  // Update nodes and edges when workflow changes
  useEffect(() => {
    if (workflow?.reactFlowData) {
      const newNodes = workflow.reactFlowData.nodes || [
        {
          id: 'start',
          type: 'input',
          data: { label: '🚀 Bắt Đầu' },
          position: { x: 250, y: 50 },
        },
      ]
      const newEdges = workflow.reactFlowData.edges || []
      
      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [workflow, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 New connection:', params);
      console.log('   sourceHandle:', params.sourceHandle);
      console.log('   targetHandle:', params.targetHandle);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  )

  // Handle node click để mở config panel
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Chỉ mở config panel cho custom nodes, không mở cho input/output nodes
    if (['httpRequest', 'database', 'email', 'delay', 'conditional', 'telegram', 'chatgpt', 'gemini', 'contentFilter', 'googleSheets'].includes(node.type || '')) {
      setSelectedNode(node)
    }
  }, [])

  // Save node configuration
  const handleSaveNodeConfig = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data }
        }
        return node
      })
    )
  }, [setNodes])

  // Delete nodes
  const onNodesDelete = useCallback((deleted: Node[]) => {
    console.log('🗑️ Deleted nodes:', deleted.map(n => n.id));
  }, [])

  // Delete edges
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    console.log('🗑️ Deleted edges:', deleted.map(e => `${e.source} -> ${e.target}`));
  }, [])

  // Drag & Drop handlers
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowInstance) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const nodeLabels: Record<string, string> = {
        httpRequest: 'HTTP Request',
        database: 'Database Query',
        email: 'Gửi Email',
        delay: 'Trì hoãn',
        conditional: 'Điều kiện',
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: nodeLabels[type] || type },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  // Lưu workflow
  const handleSave = async () => {
    if (!workflow?._id) return
    
    console.log('Saving workflow with nodes:', nodes);
    console.log('Saving workflow with edges:', edges);
    
    // 🔍 Debug edges sourceHandle
    console.log('\n🔍 Edge details:');
    edges.forEach((edge, i) => {
      console.log(`  Edge ${i}: ${edge.source} --[${edge.sourceHandle || 'NONE'}]--> ${edge.target}`);
    });
    
    await updateWorkflow(workflow._id, {
      reactFlowData: {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    })
    alert('✅ Đã lưu workflow!')
  }

  // Xuất bản workflow
  const handlePublish = async () => {
    if (!workflow?._id) return
    
    await publishWorkflow(workflow._id)
    alert('✅ Đã xuất bản workflow!')
  }

  // Chạy workflow
  const handleExecute = async () => {
    if (!workflow?._id) return
    
    setExecuting(true)
    try {
      console.log('Executing workflow:', workflow._id);
      console.log('Workflow data:', workflow);
      const result = await executeWorkflow(workflow._id)
      console.log('Execution result:', result);
      
      // Auto-refresh execution history
      if (executionHistoryRef.current) {
        setTimeout(() => {
          executionHistoryRef.current.loadRuns()
        }, 1000) // Wait 1s for workflow to start
      }
      
      alert(`✅ Workflow đã chạy!\nRun ID: ${result.runId}\nStatus: ${result.status}`)
    } catch (error: any) {
      console.error('Execution error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message;
      const validationErrors = error.response?.data?.validationErrors;
      
      let errorText = `❌ Lỗi: ${errorMsg}`;
      if (validationErrors && validationErrors.length > 0) {
        errorText += '\n\nChi tiết:\n' + validationErrors.join('\n');
      }
      
      alert(errorText)
    } finally {
      setExecuting(false)
    }
  }

  // Handle workflow name change
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWorkflowName(e.target.value)
  }

  const handleNameSave = async () => {
    if (!workflow?._id || !workflowName.trim()) return
    try {
      await updateWorkflow(workflow._id, { name: workflowName.trim() })
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update workflow name:', error)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setWorkflowName(workflow?.name || '')
      setIsEditingName(false)
    }
  }

  // Sync workflowName with workflow prop
  useEffect(() => {
    setWorkflowName(workflow?.name || '')
  }, [workflow?.name])

  return (
    <div className="workflow-canvas">
      <div className="canvas-header">
        <div>
          {isEditingName ? (
            <div className="workflow-name-edit">
              <input
                type="text"
                value={workflowName}
                onChange={handleNameChange}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className="workflow-name-input"
              />
            </div>
          ) : (
            <h2 
              className="workflow-name-display"
              onClick={() => setIsEditingName(true)}
              title="Click để đổi tên"
            >
              {workflow?.name || 'Chưa có tên'}
              <span className="edit-icon">✏️</span>
            </h2>
          )}
          <span className="workflow-status">
            {workflow?.status === 'published' ? '✅ Đã xuất bản' : '📝 Đang chỉnh sửa'}
          </span>
        </div>
        <div className="canvas-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleSave}
            disabled={!workflow?._id}
          >
            💾 Lưu
          </button>
          <button 
            className="btn btn-success"
            onClick={handlePublish}
            disabled={!workflow?._id || workflow?.status === 'published'}
          >
            🚀 Xuất Bản
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={!workflow?._id || workflow?.status !== 'published' || executing}
          >
            {executing ? '⏳ Đang chạy...' : '▶️ Chạy Thử'}
          </button>
        </div>
      </div>

      <div className="canvas-main">
        <div className="canvas-left">
          <div className="canvas-toolbar">
            <div className="node-palette">
              <h3>Kéo thả các khối:</h3>
              <div className="palette-items">
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'httpRequest')}
                >
                  🔗 HTTP Request
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'database')}
                >
                  🗄️ Database
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'delay')}
                >
                  ⏱️ Delay
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'conditional')}
                >
                  ◆ Điều kiện
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'email')}
                >
                  📧 Email
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'telegram')}
                >
                  💬 Telegram
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'chatgpt')}
                >
                  🧠 ChatGPT
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'gemini')}
                >
                  💎 Gemini AI
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'contentFilter')}
                >
                  🔍 Lọc Nội Dung
                </div>
                <div 
                  className="palette-item" 
                  draggable
                  onDragStart={(e) => onDragStart(e, 'googleSheets')}
                >
                  📊 Google Sheets
                </div>
              </div>
            </div>
          </div>

          <div className="canvas-flow" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              deleteKeyCode="Delete"
              multiSelectionKeyCode="Control"
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>

        <div className="canvas-right">
          <div className="right-panel-tabs">
            <button
              className={`tab-button ${rightPanelView === 'history' ? 'active' : ''}`}
              onClick={() => setRightPanelView('history')}
            >
              📊 Lịch sử
            </button>
            <button
              className={`tab-button ${rightPanelView === 'schedules' ? 'active' : ''}`}
              onClick={() => setRightPanelView('schedules')}
            >
              📅 Lịch chạy
            </button>
            <button
              className={`tab-button ${rightPanelView === 'webhooks' ? 'active' : ''}`}
              onClick={() => setRightPanelView('webhooks')}
            >
              🪝 Webhooks
            </button>
          </div>

          {rightPanelView === 'history' ? (
            <ExecutionHistory ref={executionHistoryRef} workflowId={workflow?._id || ''} />
          ) : rightPanelView === 'schedules' ? (
            <ScheduleManager workflowId={workflow?._id || ''} />
          ) : (
            <WebhookManager workflowId={workflow?._id || ''} />
          )}
        </div>
      </div>

      <NodeConfigPanel
        node={selectedNode}
        nodes={nodes}
        edges={edges}
        onClose={() => setSelectedNode(null)}
        onSave={handleSaveNodeConfig}
      />
    </div>
  )
}

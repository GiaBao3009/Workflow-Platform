# 📘 FRONTEND - GIẢI THÍCH CHI TIẾT CODE

> **Mục đích file này:** Giúp bạn hiểu rõ cách React Frontend hoạt động, React Flow integration, State management với Zustand, và UI/UX patterns.

---

## 📁 Cấu Trúc Thư Mục Frontend

```
apps/frontend/
├── src/
│   ├── main.tsx                     # 🚀 Entry point - React app khởi động
│   ├── App.tsx                      # 🎯 Root component - Routing & Layout
│   ├── pages/
│   │   ├── AdminDashboard.tsx       # 👑 Admin management page
│   │   └── ResetPassword.tsx        # 🔐 Password reset page
│   ├── components/
│   │   ├── WorkflowCanvas.tsx       # 🎨 Main workflow editor (React Flow)
│   │   ├── NodeConfigPanel.tsx      # ⚙️ Node configuration sidebar
│   │   ├── ExecutionHistory.tsx     # 📊 Workflow run history
│   │   ├── ScheduleManager.tsx      # ⏰ CRON scheduler
│   │   ├── WebhookManager.tsx       # 🪝 Webhook config & testing
│   │   ├── Sidebar.tsx              # 📋 Workflow list
│   │   ├── Header.tsx               # 🎩 Top navigation bar
│   │   ├── AuthModal.tsx            # 🔐 Login/Register modal
│   │   └── nodes/
│   │       └── CustomNodes.tsx      # 🧩 All custom node components
│   ├── store/
│   │   ├── workflowStore.ts         # 💾 Zustand store - Workflow state
│   │   └── authStore.ts             # 🔐 Zustand store - Auth state
│   ├── services/
│   │   └── api.ts                   # 🌐 HTTP client - API calls
│   ├── utils/
│   │   └── variableUtils.ts         # 🔧 Variable parsing helpers
│   └── styles/
│       └── theme.css                # 🎨 CSS variables & themes
├── index.html                       # HTML template
├── vite.config.ts                   # ⚡ Vite build config
└── package.json
```

---

## 🚀 File 1: `main.tsx` - Entry Point

### 📌 Khởi Tạo React App

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

**Giải thích từng dòng:**

### 1.1 ReactDOM.createRoot

```tsx
ReactDOM.createRoot(document.getElementById('root')!)
```

**React 18 Concurrent Mode:**
- **Old API (React 17):** `ReactDOM.render(<App />, document.getElementById('root'))`
- **New API (React 18):** `ReactDOM.createRoot(...).render(<App />)`

**Tại sao thay đổi?**
- React 18 hỗ trợ **Concurrent Rendering** - render có thể bị interrupt/pause
- Ví dụ: User gõ input → React pause render hiện tại → prioritize input handling
- **Benefits:**
  - Smoother UI updates
  - Better performance với large lists
  - Automatic batching (nhiều setState gộp thành 1 re-render)

**TypeScript `!` operator:**
```tsx
document.getElementById('root')!
```
- `!` = **non-null assertion operator**
- Bảo TypeScript: "Tôi chắc chắn element này tồn tại, đừng warning!"
- Nếu không có `!`, TypeScript complain: `Argument of type 'HTMLElement | null' is not assignable...`

### 1.2 React.StrictMode

```tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**StrictMode là gì?**
- Wrapper component giúp phát hiện bugs trong development
- **Không render gì** lên UI, chỉ activate checks & warnings

**StrictMode checks:**
1. **Unsafe lifecycle methods** (componentWillMount, componentWillReceiveProps...)
2. **Legacy string ref API** (this.refs.myInput)
3. **Unexpected side effects** (console.log in render)
4. **Deprecated APIs** (findDOMNode)

**Ví dụ warning:**
```tsx
function MyComponent() {
  console.log('Rendering...'); // ⚠️ StrictMode warning: Side effect in render
  
  return <div>Hello</div>;
}
```

**StrictMode double-render:**
- Trong development, React render mỗi component **2 lần**
- Mục đích: Detect side effects không an toàn
- Production: Chỉ render 1 lần (không ảnh hưởng performance)

### 1.3 BrowserRouter

```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

**React Router v6 routing:**
- `BrowserRouter` sử dụng HTML5 History API
- URL sạch: `/admin`, `/workflows/123` (không có `#`)
- Alternative: `HashRouter` → `/#!/admin` (dùng cho static hosting)

**BrowserRouter vs HashRouter:**
```
BrowserRouter: https://app.com/admin
HashRouter:    https://app.com/#/admin

Pros BrowserRouter:
✅ Clean URLs
✅ SEO friendly
✅ Server-side rendering support

Cons BrowserRouter:
❌ Cần config server (rewrite tất cả routes về index.html)

Pros HashRouter:
✅ Không cần server config
✅ Hoạt động với file:// protocol

Cons HashRouter:
❌ URLs xấu với #
❌ Không SEO friendly
```

---

## 🎯 File 2: `App.tsx` - Root Component & Routing

### 📌 Component Structure

```tsx
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

const TEMP_USER_ID = 'user-demo-123'

function App() {
  const { fetchWorkflows, workflows, currentWorkflow, setCurrentWorkflow } = useWorkflowStore()
  const { loadUser, handleOAuthCallback, user } = useAuthStore()

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('token') || urlParams.get('auth')) {
      handleOAuthCallback()
    } else {
      loadUser()
    }
  }, [handleOAuthCallback, loadUser])

  // Fetch workflows on mount
  useEffect(() => {
    const userId = user?._id || TEMP_USER_ID
    console.log('📊 Fetching workflows for userId:', userId)
    fetchWorkflows(userId)
  }, [fetchWorkflows, user])

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/admin" element={
        <div className="app">
          <Header />
          <AdminDashboard />
        </div>
      } />
      
      <Route path="/" element={
        <div className="app">
          <Header />
          <div className="app-container">
            <Sidebar 
              workflows={workflows}
              onSelectWorkflow={setCurrentWorkflow}
            />
            <main className="main-content">
              <WorkflowCanvas workflow={currentWorkflow} />
            </main>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App
```

---

### 🔍 2.1 Zustand Store Hooks

```tsx
const { fetchWorkflows, workflows, currentWorkflow, setCurrentWorkflow } = useWorkflowStore()
const { loadUser, handleOAuthCallback, user } = useAuthStore()
```

**Zustand là gì?**
- State management library (thay thế Redux, Context API)
- **Đơn giản hơn Redux:** Không cần actions, reducers, dispatch
- **Nhẹ hơn Context API:** Không gây re-render toàn bộ tree

**So sánh với Redux:**
```tsx
// ❌ Redux - Rất nhiều boilerplate
// 1. Define action types
const FETCH_WORKFLOWS = 'FETCH_WORKFLOWS';

// 2. Define action creators
const fetchWorkflows = (userId) => ({
  type: FETCH_WORKFLOWS,
  payload: userId
});

// 3. Define reducer
function workflowReducer(state, action) {
  switch (action.type) {
    case FETCH_WORKFLOWS:
      return { ...state, loading: true };
    default:
      return state;
  }
}

// 4. Use in component
const dispatch = useDispatch();
dispatch(fetchWorkflows(userId));

// ✅ Zustand - Cực kỳ đơn giản
const useWorkflowStore = create((set) => ({
  workflows: [],
  fetchWorkflows: async (userId) => {
    const data = await workflowApi.getAll(userId);
    set({ workflows: data.workflows });
  }
}));

// Use in component
const { fetchWorkflows } = useWorkflowStore();
fetchWorkflows(userId);
```

---

### 🎣 2.2 useEffect - OAuth & Data Fetching

#### OAuth Callback Handling
```tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('token') || urlParams.get('auth')) {
    handleOAuthCallback()
  } else {
    loadUser()
  }
}, [handleOAuthCallback, loadUser])
```

**OAuth flow:**
```
1. User clicks "Login with Google"
   ↓
2. Redirect to Google OAuth: https://accounts.google.com/o/oauth2/v2/auth?...
   ↓
3. User authorizes app
   ↓
4. Google redirects back: https://app.com/?token=jwt_token_here
   ↓
5. Frontend extracts token from URL
   ↓
6. handleOAuthCallback() saves token to localStorage
   ↓
7. Redirect to / (remove token from URL)
```

**URLSearchParams API:**
```tsx
// URL: https://app.com/?token=abc123&user=john
const urlParams = new URLSearchParams(window.location.search)

urlParams.get('token')  // "abc123"
urlParams.get('user')   // "john"
urlParams.get('foo')    // null (không tồn tại)
```

#### Data Fetching on Mount
```tsx
useEffect(() => {
  const userId = user?._id || TEMP_USER_ID
  fetchWorkflows(userId)
}, [fetchWorkflows, user])
```

**Optional chaining `?.`:**
```tsx
user?._id
// Equivalent to:
user && user._id
// Returns: user._id nếu user tồn tại, undefined nếu user null/undefined
```

**Tại sao cần dependency array `[fetchWorkflows, user]`?**
- Effect chạy lại khi `user` thay đổi (login/logout)
- `fetchWorkflows` stable (Zustand không re-create functions)
- **Best practice:** Luôn include tất cả dependencies để tránh stale closure

**Stale closure example:**
```tsx
// ❌ BAD: Missing dependency
useEffect(() => {
  console.log(user); // Luôn log user cũ!
}, []); // Empty array → effect chỉ chạy 1 lần

// ✅ GOOD: Include dependency
useEffect(() => {
  console.log(user); // Log user mới mỗi khi user thay đổi
}, [user]);
```

---

### 🛣️ 2.3 React Router v6 Routes

```tsx
<Routes>
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/" element={<WorkflowCanvas />} />
</Routes>
```

**React Router v6 changes (từ v5):**

#### Old (v5):
```tsx
<Switch>
  <Route path="/admin" component={AdminDashboard} />
  <Route path="/" component={Home} />
</Switch>
```

#### New (v6):
```tsx
<Routes>
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/" element={<Home />} />
</Routes>
```

**Key differences:**
- `<Switch>` → `<Routes>`
- `component={Component}` → `element={<Component />}`
- Routes tự động exact match (không cần `exact` prop)
- Nested routes dễ dàng hơn

**Route matching order:**
```tsx
<Routes>
  <Route path="/" element={<Home />} />           {/* Matches: / */}
  <Route path="/admin" element={<Admin />} />     {/* Matches: /admin */}
  <Route path="/admin/*" element={<Admin />} />   {/* Matches: /admin/users, /admin/settings */}
  <Route path="*" element={<NotFound />} />       {/* Catch-all (404) */}
</Routes>
```

---

## 🎨 File 3: `WorkflowCanvas.tsx` - React Flow Editor

### 📌 Tổng Quan Component

```tsx
import { useCallback, useState, useRef, useEffect } from 'react'
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

export default function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  const { updateWorkflow, publishWorkflow, executeWorkflow } = useWorkflowStore()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  
  // ... component logic
  
  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
```

---

### 🔗 3.1 React Flow Hooks

#### useNodesState & useEdgesState
```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
```

**React Flow custom hooks:**
- **Return array:** `[state, setState, onChange]`
- `onChange` handler tích hợp sẵn logic move/select/delete nodes/edges

**Tương đương vanilla React:**
```tsx
// React Flow hook:
const [nodes, setNodes, onNodesChange] = useNodesState([])

// Vanilla React equivalent:
const [nodes, setNodes] = useState([])
const onNodesChange = useCallback((changes) => {
  setNodes(nds => applyNodeChanges(changes, nds))
}, [])
```

**Changes array structure:**
```javascript
// User kéo node:
[
  {
    type: 'position',
    id: 'groq-1',
    position: { x: 150, y: 200 }
  }
]

// User select node:
[
  {
    type: 'select',
    id: 'groq-1',
    selected: true
  }
]

// User delete node:
[
  {
    type: 'remove',
    id: 'groq-1'
  }
]
```

---

### 🎯 3.2 Node Connection Handling

```tsx
const onConnect = useCallback((params: Connection | Edge) => {
  console.log('🔗 Connecting nodes:', params)
  
  // Validate connection (tùy chọn)
  if (params.source === params.target) {
    console.warn('❌ Cannot connect node to itself')
    return
  }
  
  // Add edge
  setEdges((eds) => addEdge(params, eds))
}, [setEdges])
```

**Connection object:**
```javascript
{
  source: 'groq-1',           // Source node ID
  target: 'telegram-1',       // Target node ID
  sourceHandle: null,         // Output handle ID (cho multiple outputs)
  targetHandle: null,         // Input handle ID
}
```

**addEdge helper:**
```tsx
import { addEdge } from 'reactflow'

// Manual:
setEdges(edges => [...edges, { id: `e${source}-${target}`, ...params }])

// Helper (auto-generate ID):
setEdges(edges => addEdge(params, edges))
```

---

### 🎨 3.3 Custom Node Types

```tsx
import {
  HttpRequestNode,
  DatabaseNode,
  TelegramNode,
  GroqNode,
  ContentFilterNode,
  GoogleSheetsNode,
} from './nodes/CustomNodes'

const nodeTypes = {
  httpRequest: HttpRequestNode,
  database: DatabaseNode,
  telegram: TelegramNode,
  groq: GroqNode,
  contentFilter: ContentFilterNode,
  googleSheets: GoogleSheetsNode,
}

<ReactFlow nodeTypes={nodeTypes} ... />
```

**Custom node component structure:**
```tsx
// GroqNode.tsx
export function GroqNode({ data, selected }: NodeProps) {
  return (
    <div className={`custom-node groq-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header">
        <span className="node-icon">🤖</span>
        <span className="node-title">Groq AI</span>
      </div>
      
      <div className="node-body">
        <p className="node-label">Model:</p>
        <p className="node-value">{data.model || 'Not configured'}</p>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

**Handle types:**
- `type="target"` - Input handle (nhận connection)
- `type="source"` - Output handle (gửi connection)

**Multiple handles:**
```tsx
// Content Filter node với 2 outputs
<Handle type="source" position={Position.Bottom} id="pass" />
<Handle type="source" position={Position.Bottom} id="reject" style={{ left: 70 }} />
```

---

### 💾 3.4 Auto-Save Implementation

```tsx
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
const nodesRef = useRef(nodes)
const edgesRef = useRef(edges)

// Keep refs updated
useEffect(() => {
  nodesRef.current = nodes
}, [nodes])

useEffect(() => {
  edgesRef.current = edges
}, [edges])

// Auto-save with debounce
const saveWorkflow = useCallback(() => {
  if (!workflow?._id) return

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current)
  }

  saveTimeoutRef.current = setTimeout(async () => {
    console.log('💾 Auto-saving workflow...')
    await updateWorkflow(workflow._id, {
      reactFlowData: {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
      }
    })
  }, 30000) // 30 seconds
}, [workflow?._id, reactFlowInstance, updateWorkflow])

// Trigger auto-save when nodes/edges change
useEffect(() => {
  if (nodes.length > 0 || edges.length > 0) {
    saveWorkflow()
  }
  
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }
}, [nodes, edges, saveWorkflow])
```

**Phân tích kỹ thuật:**

#### Debouncing Pattern
```tsx
// User kéo node 10 lần trong 5 giây:
// Without debounce: 10 API calls
// With debounce: 1 API call (sau 30s từ lần kéo cuối)

// Clear previous timeout
clearTimeout(saveTimeoutRef.current)

// Set new timeout
saveTimeoutRef.current = setTimeout(() => {
  // Save logic
}, 30000)
```

**Ví dụ timeline:**
```
0s:  User kéo node → Start timer (30s)
5s:  User kéo tiếp → Cancel timer, start new timer (30s)
10s: User kéo tiếp → Cancel timer, start new timer (30s)
40s: Timer done → Save API call
```

#### useRef for Latest Values
```tsx
const nodesRef = useRef(nodes)

useEffect(() => {
  nodesRef.current = nodes
}, [nodes])
```

**Tại sao cần ref thay vì dùng trực tiếp `nodes`?**

**Problem với closure:**
```tsx
// ❌ BAD: Stale closure
const saveWorkflow = useCallback(() => {
  setTimeout(() => {
    console.log(nodes); // Logs nodes từ lúc callback được tạo!
  }, 30000)
}, []) // Empty deps → callback chỉ tạo 1 lần

// ✅ GOOD: Use ref
const saveWorkflow = useCallback(() => {
  setTimeout(() => {
    console.log(nodesRef.current); // Luôn lấy nodes mới nhất!
  }, 30000)
}, [])
```

#### Cleanup Function
```tsx
useEffect(() => {
  saveWorkflow()
  
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }
}, [nodes, edges, saveWorkflow])
```

**Khi nào cleanup chạy?**
- Component unmount (user navigate away)
- Dependencies change (nodes/edges update → cancel old timeout, start new)

**Tại sao cần cleanup?**
- Tránh memory leaks
- Cancel API calls không cần thiết
- Ví dụ: User edit workflow → navigate away trước khi save → cancel timeout để không save state cũ

---

### 🖱️ 3.5 Drag & Drop Node Creation

```tsx
const [reactFlowWrapper, setReactFlowWrapper] = useState<HTMLDivElement | null>(null)

const onDragOver = useCallback((event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}, [])

const onDrop = useCallback((event: DragEvent) => {
  event.preventDefault()
  
  const type = event.dataTransfer.getData('application/reactflow')
  if (!type || !reactFlowInstance) return
  
  const position = reactFlowInstance.project({
    x: event.clientX,
    y: event.clientY,
  })
  
  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: getDefaultNodeData(type),
  }
  
  setNodes((nds) => nds.concat(newNode))
}, [reactFlowInstance, setNodes])
```

**Drag & Drop API:**

#### 1. Draggable Element (Sidebar)
```tsx
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('application/reactflow', 'groq')
    e.dataTransfer.effectAllowed = 'move'
  }}
>
  🤖 Groq AI
</div>
```

#### 2. Drop Zone (Canvas)
```tsx
<div
  ref={setReactFlowWrapper}
  onDragOver={onDragOver}  // Allow drop
  onDrop={onDrop}          // Handle drop
>
  <ReactFlow ... />
</div>
```

**Screen coordinates → Canvas coordinates:**
```tsx
const position = reactFlowInstance.project({
  x: event.clientX,  // Mouse X on screen
  y: event.clientY,  // Mouse Y on screen
})
// → { x: 250, y: 150 } trong canvas coordinate system (tính cả zoom/pan)
```

**Tại sao cần project()?**
```
Canvas đã zoom 200% và pan (100, 50):

Screen coordinates (500, 300)
         ↓ project()
Canvas coordinates (200, 125)

Nếu không project → node xuất hiện sai vị trí khi zoom/pan!
```

---

## 💾 File 4: `workflowStore.ts` - Zustand State Management

### 📌 Store Definition

```typescript
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

  // ... other actions
}))
```

---

### 🎯 4.1 Zustand Core Concepts

#### Create Store
```typescript
const useStore = create<State>((set, get) => ({
  // Initial state
  count: 0,
  
  // Actions
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

**set() function:**
```typescript
// 1. Object merge
set({ loading: true })
// State: { loading: true, ...otherFields }

// 2. Function form (access previous state)
set(state => ({ count: state.count + 1 }))

// 3. Replace entire state (replace: true)
set({ count: 0 }, true)
```

**get() function:**
```typescript
const useStore = create((set, get) => ({
  count: 0,
  doubleCount: () => get().count * 2,
  
  incrementBy: (amount: number) => {
    const currentCount = get().count
    set({ count: currentCount + amount })
  }
}))
```

---

### 🔄 4.2 Async Actions with API Calls

```typescript
fetchWorkflows: async (userId: string) => {
  // 1. Set loading state
  set({ loading: true, error: null })
  
  try {
    // 2. Call API
    const data = await workflowApi.getAll(userId)
    
    // 3. Update state with data
    set({ workflows: data.workflows, loading: false })
  } catch (error: any) {
    // 4. Handle error
    set({ error: error.message, loading: false })
  }
}
```

**Loading states pattern:**
```tsx
// Component sử dụng:
function WorkflowList() {
  const { workflows, loading, error, fetchWorkflows } = useWorkflowStore()
  
  useEffect(() => {
    fetchWorkflows('user-123')
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <ul>
      {workflows.map(wf => <li key={wf._id}>{wf.name}</li>)}
    </ul>
  )
}
```

---

### 🎨 4.3 Optimistic Updates

```typescript
updateWorkflow: async (workflowId: string, updates: Partial<Workflow>) => {
  // Optimistic update: Update UI trước khi API response
  set(state => ({
    workflows: state.workflows.map(wf =>
      wf._id === workflowId ? { ...wf, ...updates } : wf
    ),
  }))
  
  try {
    const data = await workflowApi.update(workflowId, updates)
    
    // Replace với data thật từ server
    set(state => ({
      workflows: state.workflows.map(wf =>
        wf._id === workflowId ? data.workflow : wf
      ),
    }))
  } catch (error: any) {
    // Rollback nếu lỗi
    set(state => ({
      workflows: state.workflows,  // Keep old data
      error: error.message,
    }))
  }
}
```

**Optimistic update flow:**
```
1. User clicks "Publish workflow"
   ↓
2. UI immediately shows "Published" (optimistic)
   ↓
3. API call in background
   ↓
4a. API success → Keep UI as is
4b. API fail → Rollback to "Draft" + show error
```

**Benefits:**
- **Instant feedback** - UI cảm giác nhanh
- **Better UX** - Không phải chờ API response
- **Perceived performance** - App cảm giác responsive hơn

---

### 🔍 4.4 Zustand Selectors

```tsx
// ❌ BAD: Subscribe to entire store → re-render khi bất kỳ field nào thay đổi
const { workflows, currentWorkflow, loading, error } = useWorkflowStore()

// ✅ GOOD: Subscribe chỉ field cần thiết
const workflows = useWorkflowStore(state => state.workflows)
const loading = useWorkflowStore(state => state.loading)
```

**Performance comparison:**
```tsx
// Component 1: Chỉ cần workflows
function WorkflowList() {
  const workflows = useWorkflowStore(state => state.workflows)
  // Re-render chỉ khi workflows thay đổi
  // Không re-render khi loading/error thay đổi ✅
}

// Component 2: Chỉ cần loading
function LoadingIndicator() {
  const loading = useWorkflowStore(state => state.loading)
  // Re-render chỉ khi loading thay đổi
  // Không re-render khi workflows thay đổi ✅
}
```

---

## 🌐 File 5: `api.ts` - HTTP Client

### 📌 API Service

```typescript
import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor (add auth token)
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor (handle errors)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get(url)
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url)
    return response.data
  }
}

const apiClient = new ApiClient()

// Workflow API
export const workflowApi = {
  getAll: (userId: string) =>
    apiClient.get<{ workflows: Workflow[] }>(`/api/workflows?userId=${userId}`),
  
  getById: (id: string) =>
    apiClient.get<{ workflow: Workflow }>(`/api/workflows/${id}`),
  
  create: (workflow: Partial<Workflow>) =>
    apiClient.post<{ workflow: Workflow }>('/api/workflows', workflow),
  
  update: (id: string, updates: Partial<Workflow>) =>
    apiClient.put<{ workflow: Workflow }>(`/api/workflows/${id}`, updates),
  
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/workflows/${id}`),
  
  publish: (id: string) =>
    apiClient.post<{ success: boolean }>(`/api/workflows/${id}/publish`),
  
  execute: (id: string, inputData?: any) =>
    apiClient.post<{ workflowRunId: string }>(`/api/workflows/${id}/execute`, { inputData }),
}
```

---

### 🔧 5.1 Axios Interceptors

#### Request Interceptor - Auto Add Auth Token
```typescript
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Flow:**
```
apiClient.get('/api/workflows')
    ↓
Request Interceptor
    ↓
Add Authorization header
    ↓
Actual HTTP request
```

**Equivalent manual code:**
```typescript
// ❌ Without interceptor: Phải thêm token mọi nơi
const token = localStorage.getItem('auth_token')
axios.get('/api/workflows', {
  headers: { Authorization: `Bearer ${token}` }
})

// ✅ With interceptor: Tự động thêm
axios.get('/api/workflows') // Token added automatically!
```

#### Response Interceptor - Global Error Handling
```typescript
this.client.interceptors.response.use(
  (response) => response,  // Success: pass through
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized → clear token & redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

**Benefits:**
- Centralized error handling
- Auto-redirect on auth expiry
- DRY: Không cần try-catch mọi nơi

---

### 🎯 5.2 TypeScript Generics trong API

```typescript
async get<T>(url: string): Promise<T> {
  const response = await this.client.get(url)
  return response.data
}
```

**Type-safe API calls:**
```typescript
// TypeScript biết type của response
interface WorkflowResponse {
  workflows: Workflow[]
  total: number
}

const data = await apiClient.get<WorkflowResponse>('/api/workflows')
// data.workflows → type-safe ✅
// data.foo → TypeScript error ❌
```

---

## 🎓 Best Practices & Patterns

### 1. Component Composition

```tsx
// ❌ BAD: Monolithic component
function WorkflowPage() {
  return (
    <div>
      {/* 500 lines of JSX... */}
    </div>
  )
}

// ✅ GOOD: Compose from smaller components
function WorkflowPage() {
  return (
    <div className="workflow-page">
      <Header />
      <Sidebar />
      <WorkflowCanvas />
      <NodeConfigPanel />
    </div>
  )
}
```

### 2. Custom Hooks

```tsx
// Extract logic vào custom hook
function useAutoSave(workflow, nodes, edges) {
  const saveTimeoutRef = useRef(null)
  
  useEffect(() => {
    // Auto-save logic
  }, [nodes, edges])
  
  return { isSaving: false }
}

// Component sử dụng
function WorkflowCanvas() {
  const { isSaving } = useAutoSave(workflow, nodes, edges)
  // ...
}
```

### 3. Memoization

```tsx
// Memoize expensive computations
const sortedNodes = useMemo(() => {
  return nodes.sort((a, b) => a.position.y - b.position.y)
}, [nodes])

// Memoize callbacks
const handleNodeClick = useCallback((node) => {
  setSelectedNode(node)
}, [])
```

### 4. Error Boundaries

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}

// Usage
<ErrorBoundary>
  <WorkflowCanvas />
</ErrorBoundary>
```

---

## 📝 Tóm Tắt Kiến Thức

### React Core Concepts

1. **Component Lifecycle:**
   - Mount → useEffect with []
   - Update → useEffect with [deps]
   - Unmount → useEffect cleanup function

2. **Hooks:**
   - useState - Local state
   - useEffect - Side effects
   - useCallback - Memoize functions
   - useMemo - Memoize values
   - useRef - Mutable refs

3. **State Management:**
   - Zustand stores
   - Selectors for performance
   - Async actions

4. **React Flow:**
   - Nodes & edges state
   - Custom node components
   - Connection handling
   - Drag & drop

5. **Routing:**
   - React Router v6
   - Routes & Route
   - Navigation with Link

---

**Next Steps:**
- Đọc `WORKER_CODE_EXPLAINED.md` để hiểu Temporal worker
- Thực hành: Tạo custom node type mới
- Học thêm: React Flow advanced features (sub-flows, groups)


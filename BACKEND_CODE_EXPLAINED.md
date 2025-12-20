# 📘 BACKEND API - GIẢI THÍCH CHI TIẾT CODE

> **Mục đích file này:** Giúp bạn hiểu rõ cách Backend API hoạt động, từng đoạn code làm gì, và cách các phần kết nối với nhau.

---

## 📁 Cấu Trúc Thư Mục Backend

```
apps/backend-api/
├── src/
│   ├── index.ts                    # 🚀 Entry point - Server Express chính
│   ├── mongodb.service.ts          # 💾 Quản lý kết nối MongoDB (Singleton)
│   ├── workflow-converter.ts       # 🔄 Convert ReactFlow → Temporal
│   ├── schema.mongodb.ts           # 📊 MongoDB Schemas (Mongoose models)
│   ├── auth/
│   │   ├── passport.config.ts      # 🔐 Passport JWT + OAuth strategies
│   │   └── auth.routes.ts          # 🛣️ Routes đăng nhập/đăng ký
│   ├── routes/
│   │   ├── admin.routes.ts         # 👑 Admin endpoints (protected)
│   │   └── admin.routes.part2.ts   # 👑 Admin endpoints phần 2
│   ├── middlewares/
│   │   └── auth.middleware.ts      # 🛡️ JWT verification
│   └── services/
│       └── temporal.service.ts     # ⏱️ Temporal client wrapper
├── .env                            # 🔑 Environment variables
└── package.json
```

---

## 🚀 File 1: `index.ts` - Server Express Chính

### 📌 Tổng Quan
File này là **trái tim của Backend API**, chịu trách nhiệm:
- Khởi tạo Express server
- Kết nối MongoDB và Temporal
- Định nghĩa tất cả REST API endpoints
- Xử lý webhooks từ Telegram/HTTP

---

### 📦 1.1 Import Dependencies

```typescript
import express, { Express, Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { Connection, Client } from '@temporalio/client';
import { convertWorkflowToTemporal, validateWorkflow } from './workflow-converter';
import MongoDBService from './mongodb.service';
import { Workflow, WorkflowRun, WorkflowSchedule, Webhook, WebhookLog } from './schema.mongodb';
```

**Giải thích:**
- `express`: Framework web server (giống Flask trong Python)
- `dotenv`: Load environment variables từ file `.env`
- `@temporalio/client`: Kết nối tới Temporal server để trigger workflows
- `workflow-converter`: Module tự viết để convert ReactFlow data → Temporal config
- `mongodb.service`: Singleton service quản lý connection MongoDB
- `schema.mongodb`: Mongoose models (User, Workflow, WorkflowRun...)

**Tại sao cần Temporal Client?**
- Backend không chạy workflow trực tiếp
- Backend chỉ **gửi lệnh** cho Temporal: "Hãy chạy workflow ABC với input XYZ"
- Temporal Server nhận lệnh → phân phối cho Workers → Workers thực thi

---

### 🔌 1.2 Khởi Tạo Temporal Client

```typescript
let temporalClient: Client | null = null;

async function initTemporalClient() {
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });
    temporalClient = new Client({ connection });
    console.log('✅ Connected to Temporal Server');
  } catch (error) {
    console.warn('⚠️ Temporal Server không khả dụng');
    // Không throw error để app vẫn chạy được
  }
}
```

**Giải thích từng dòng:**

1. **`let temporalClient: Client | null = null`**
   - Khai báo biến global để lưu Temporal client
   - `null` ban đầu vì chưa kết nối

2. **`Connection.connect({ address: 'localhost:7233' })`**
   - Tạo kết nối TCP tới Temporal Server
   - Port 7233 là default port của Temporal
   - Đây chỉ là **kết nối**, chưa phải client

3. **`new Client({ connection })`**
   - Wrap connection thành Client object
   - Client có các methods: `workflow.start()`, `workflow.execute()`, `workflow.terminate()`

4. **Try-catch không throw error**
   - Nếu Temporal offline, app vẫn chạy (chỉ API endpoints không chạy được workflows)
   - Điều này tốt cho development: không bắt buộc phải start Temporal

**Lưu ý quan trọng:**
```typescript
// SAI: Tạo client mới mỗi lần gọi API
app.post('/api/workflows/execute', async (req, res) => {
  const client = new Client({ ... }); // ❌ Tốn tài nguyên!
});

// ĐÚNG: Dùng lại temporalClient global
app.post('/api/workflows/execute', async (req, res) => {
  if (!temporalClient) {
    return res.status(503).json({ error: 'Temporal unavailable' });
  }
  await temporalClient.workflow.start(...); // ✅
});
```

---

### 🌐 1.3 Middleware Setup

```typescript
app.use(express.json());
app.use(passport.initialize());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

**Giải thích middleware:**

#### 1.3.1 `express.json()`
```typescript
app.use(express.json());
```
- **Chức năng:** Parse request body từ JSON string → JavaScript object
- **Ví dụ:**
  ```javascript
  // Client gửi:
  fetch('/api/workflows', {
    body: JSON.stringify({ name: 'My Workflow' })
  });
  
  // Backend nhận:
  app.post('/api/workflows', (req, res) => {
    console.log(req.body); // { name: 'My Workflow' }
    // Không cần JSON.parse(req.body) vì express.json() đã parse!
  });
  ```

#### 1.3.2 `passport.initialize()`
- **Chức năng:** Khởi tạo Passport authentication framework
- Passport hỗ trợ nhiều strategies: JWT, OAuth (Google, GitHub), Local (username/password)
- Sau khi initialize, có thể dùng `passport.authenticate('jwt')` để protect routes

#### 1.3.3 CORS Middleware
```typescript
res.header('Access-Control-Allow-Origin', '*');
```

**CORS là gì?**
- **C**ross-**O**rigin **R**esource **S**haring
- Trình duyệt chặn requests từ domain khác vì security
- Ví dụ: Frontend chạy `localhost:5174`, Backend chạy `localhost:3001` → khác origin!

**Tại sao cần CORS headers?**
```
Frontend (localhost:5174)  --HTTP Request-->  Backend (localhost:3001)
                           <--403 Forbidden--  (nếu không có CORS headers)
```

**Giải thích từng header:**
- `Access-Control-Allow-Origin: *` → Cho phép mọi domain (development only!)
- `Access-Control-Allow-Methods: GET, POST, ...` → Cho phép các HTTP methods
- `Access-Control-Allow-Headers: Authorization` → Cho phép JWT token trong header

**Xử lý OPTIONS preflight:**
```typescript
if (req.method === 'OPTIONS') {
  return res.sendStatus(200);
}
```
- Trình duyệt gửi OPTIONS request trước POST/PUT (preflight check)
- Backend phải trả 200 OK để confirm CORS allowed
- Sau đó trình duyệt mới gửi request thật

---

### 📊 1.4 API Endpoints - Workflows CRUD

#### 1.4.1 GET /api/workflows - Lấy Danh Sách Workflows

```typescript
app.get('/api/workflows', async (req: Request, res: Response) => {
  const { userId } = req.query;
  
  try {
    if (usingMongoDB) {
      const userWorkflows = await Workflow.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
      
      return res.json({
        success: true,
        total: userWorkflows.length,
        workflows: userWorkflows,
      });
    } else {
      // Fallback: In-memory storage
      const userWorkflows = Array.from(workflows.values())
        .filter((wf: any) => wf.userId === userId);
      
      return res.json({
        success: true,
        total: userWorkflows.length,
        workflows: userWorkflows,
      });
    }
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch workflows', 
      message: error.message 
    });
  }
});
```

**Phân tích từng phần:**

##### Query Parameter Extraction
```typescript
const { userId } = req.query;
```
- **URL example:** `GET /api/workflows?userId=user-123`
- `req.query` là object: `{ userId: 'user-123' }`
- Destructuring: `const { userId } = ...` giống `const userId = req.query.userId`

##### MongoDB Query
```typescript
const userWorkflows = await Workflow.find({ userId })
  .sort({ createdAt: -1 })
  .lean();
```

**Giải thích từng method:**

1. **`Workflow.find({ userId })`**
   - Query MongoDB collection `workflows`
   - Filter: `WHERE userId = 'user-123'`
   - Trả về array workflows của user đó

2. **`.sort({ createdAt: -1 })`**
   - Sắp xếp theo `createdAt` descending (mới nhất trước)
   - `-1` = descending, `1` = ascending
   - Giống SQL: `ORDER BY createdAt DESC`

3. **`.lean()`**
   - Convert Mongoose document → plain JavaScript object
   - Không có methods, getters/setters → nhanh hơn
   - **Ví dụ:**
     ```javascript
     // Không có .lean()
     const workflow = await Workflow.findOne({ _id: '123' });
     workflow.save(); // ✅ Có method save()
     
     // Có .lean()
     const workflow = await Workflow.findOne({ _id: '123' }).lean();
     workflow.save(); // ❌ Error: save is not a function
     ```

##### Fallback Strategy
```typescript
if (usingMongoDB) {
  // Query từ MongoDB
} else {
  // Query từ in-memory Map
  const userWorkflows = Array.from(workflows.values())
    .filter((wf: any) => wf.userId === userId);
}
```

**Tại sao cần fallback?**
- Development: MongoDB có thể chưa start
- Production: MongoDB có thể disconnect tạm thời
- Graceful degradation: App vẫn chạy được (dù mất data sau restart)

---

#### 1.4.2 POST /api/workflows - Tạo Workflow Mới

```typescript
app.post('/api/workflows', async (req: Request, res: Response) => {
  try {
    const { name, description, userId, triggerType, nodes, edges } = req.body;
    
    // Validate required fields
    if (!name || !userId) {
      return res.status(400).json({ 
        error: 'name và userId là bắt buộc' 
      });
    }
    
    const workflowData = {
      name,
      description: description || '',
      userId,
      triggerType: triggerType || 'MANUAL',
      status: 'draft',
      reactFlowData: {
        nodes: nodes || [],
        edges: edges || [],
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (usingMongoDB) {
      const workflow = new Workflow(workflowData);
      await workflow.save();
      return res.status(201).json({ 
        success: true, 
        workflow 
      });
    } else {
      const workflowId = `wf_${Date.now()}`;
      workflows.set(workflowId, { _id: workflowId, ...workflowData });
      return res.status(201).json({ 
        success: true, 
        workflow: workflows.get(workflowId) 
      });
    }
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to create workflow', 
      message: error.message 
    });
  }
});
```

**Phân tích chi tiết:**

##### Request Body Destructuring
```typescript
const { name, description, userId, triggerType, nodes, edges } = req.body;
```
- **Client gửi:**
  ```json
  {
    "name": "Telegram Bot",
    "userId": "user-123",
    "triggerType": "WEBHOOK",
    "nodes": [...],
    "edges": [...]
  }
  ```
- Destructuring giúp code ngắn gọn thay vì `req.body.name`, `req.body.userId`...

##### Validation
```typescript
if (!name || !userId) {
  return res.status(400).json({ error: 'name và userId là bắt buộc' });
}
```

**HTTP Status Codes:**
- `400 Bad Request` - Client gửi data sai format/thiếu field
- `401 Unauthorized` - Chưa đăng nhập
- `403 Forbidden` - Đăng nhập rồi nhưng không có quyền
- `404 Not Found` - Resource không tồn tại
- `500 Internal Server Error` - Lỗi server (bug, database down...)

##### Mongoose Save
```typescript
const workflow = new Workflow(workflowData);
await workflow.save();
```

**Cách Mongoose hoạt động:**

1. **`new Workflow(data)`** → Tạo Mongoose document (chưa lưu DB)
2. **`await workflow.save()`** → INSERT vào MongoDB
   - Mongoose tự động:
     - Validate schema (required fields, types...)
     - Tạo `_id` nếu chưa có
     - Chạy pre-save hooks (nếu có)
     - INSERT document
     - Trả về document với `_id` mới

**Ví dụ SQL tương đương:**
```sql
INSERT INTO workflows (name, userId, status, createdAt)
VALUES ('Telegram Bot', 'user-123', 'draft', NOW())
RETURNING *;
```

##### Status Code 201
```typescript
return res.status(201).json({ success: true, workflow });
```
- **201 Created** - Resource mới đã được tạo thành công
- **200 OK** - Dùng cho GET/PUT/DELETE
- **204 No Content** - Success nhưng không trả data (DELETE thường dùng)

---

#### 1.4.3 PUT /api/workflows/:id - Update Workflow

```typescript
app.put('/api/workflows/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    if (usingMongoDB) {
      const workflow = await Workflow.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      return res.json({ success: true, workflow });
    } else {
      const workflow = workflows.get(id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      Object.assign(workflow, updates, { updatedAt: new Date() });
      return res.json({ success: true, workflow });
    }
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to update workflow', 
      message: error.message 
    });
  }
});
```

**Phân tích kỹ thuật:**

##### URL Parameters
```typescript
const { id } = req.params;
```
- **URL:** `PUT /api/workflows/693ba5dcbb9af2ecdcaa674a`
- `req.params` = `{ id: '693ba5dcbb9af2ecdcaa674a' }`
- Route definition: `app.put('/api/workflows/:id', ...)`
  - `:id` là placeholder (giống Flask `<id>` hay Django `<str:id>`)

##### Mongoose findByIdAndUpdate
```typescript
const workflow = await Workflow.findByIdAndUpdate(
  id,                                      // Filter: _id = id
  { ...updates, updatedAt: new Date() },   // Update data
  { new: true, runValidators: true }       // Options
);
```

**Options giải thích:**

1. **`new: true`**
   - Trả về document **SAU KHI** update
   - Default `false`: trả về document CŨ (trước khi update)
   - **Ví dụ:**
     ```javascript
     // Database: { name: 'Old Name' }
     
     // new: false (default)
     const result = await Workflow.findByIdAndUpdate(
       id, 
       { name: 'New Name' },
       { new: false }
     );
     console.log(result.name); // "Old Name" ❌
     
     // new: true
     const result = await Workflow.findByIdAndUpdate(
       id, 
       { name: 'New Name' },
       { new: true }
     );
     console.log(result.name); // "New Name" ✅
     ```

2. **`runValidators: true`**
   - Chạy schema validators khi update
   - Default `false` vì performance
   - **Tại sao cần?**
     ```javascript
     // Schema:
     const WorkflowSchema = new Schema({
       name: { type: String, required: true, minLength: 3 }
     });
     
     // Không có runValidators:
     await Workflow.findByIdAndUpdate(id, { name: '' }); // ✅ Success (BUG!)
     
     // Có runValidators:
     await Workflow.findByIdAndUpdate(
       id, 
       { name: '' }, 
       { runValidators: true }
     ); // ❌ ValidationError: name too short
     ```

##### In-Memory Update with Object.assign
```typescript
Object.assign(workflow, updates, { updatedAt: new Date() });
```

**Object.assign là gì?**
- Copy properties từ sources → target
- Syntax: `Object.assign(target, ...sources)`
- **Ví dụ:**
  ```javascript
  const workflow = { name: 'Old', status: 'draft' };
  const updates = { status: 'published', version: 2 };
  
  Object.assign(workflow, updates, { updatedAt: new Date() });
  
  // Kết quả:
  // workflow = {
  //   name: 'Old',              // Giữ nguyên
  //   status: 'published',      // Updated
  //   version: 2,               // Added
  //   updatedAt: Date(...)      // Added
  // }
  ```

---

### 🔄 1.5 Workflow Execution - Execute Endpoint

```typescript
app.post('/api/workflows/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { inputData } = req.body;
  
  try {
    if (!temporalClient) {
      return res.status(503).json({ 
        error: 'Temporal Server unavailable' 
      });
    }
    
    // Get workflow from DB
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    // Convert ReactFlow → Temporal activities
    const nodes = workflow.reactFlowData?.nodes || [];
    const edges = workflow.reactFlowData?.edges || [];
    const activities = convertWorkflowToTemporal(nodes, edges);
    
    // Start Temporal workflow
    const workflowId = `${workflow._id}-manual-${Date.now()}`;
    const handle = await temporalClient.workflow.start('executeWorkflow', {
      taskQueue: 'workflow-task-queue',
      workflowId,
      args: [workflow._id, activities, inputData || {}],
    });
    
    // Save workflow run to DB
    const workflowRun = new WorkflowRun({
      workflowId: workflow._id,
      temporalWorkflowId: workflowId,
      status: 'running',
      startedAt: new Date(),
      inputData,
    });
    await workflowRun.save();
    
    return res.json({
      success: true,
      workflowRunId: workflowRun._id,
      temporalWorkflowId: workflowId,
      message: 'Workflow started',
    });
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to execute workflow', 
      message: error.message 
    });
  }
});
```

**Phân tích sâu:**

##### Temporal Client Check
```typescript
if (!temporalClient) {
  return res.status(503).json({ error: 'Temporal Server unavailable' });
}
```
- **503 Service Unavailable** - Service dependency down
- Fail fast: Không cố gắng execute khi Temporal offline

##### Convert ReactFlow → Temporal
```typescript
const activities = convertWorkflowToTemporal(nodes, edges);
```

**Ví dụ conversion:**
```javascript
// Input: ReactFlow nodes + edges
const nodes = [
  { id: 'groq-1', type: 'groq', data: { model: 'llama-3.3-70b', ... } },
  { id: 'telegram-1', type: 'telegram', data: { chatId: '123', ... } }
];
const edges = [
  { source: 'groq-1', target: 'telegram-1' }
];

// Output: Temporal activities
const activities = [
  {
    nodeId: 'groq-1',
    activityName: 'callGroq',
    config: { model: 'llama-3.3-70b', ... },
    order: 0
  },
  {
    nodeId: 'telegram-1',
    activityName: 'sendTelegramMessage',
    config: { chatId: '123', ... },
    order: 1
  }
];
```

##### Start Temporal Workflow
```typescript
const handle = await temporalClient.workflow.start('executeWorkflow', {
  taskQueue: 'workflow-task-queue',
  workflowId: `${workflow._id}-manual-${Date.now()}`,
  args: [workflow._id, activities, inputData || {}],
});
```

**Giải thích từng parameter:**

1. **`'executeWorkflow'`**
   - Tên workflow function trong `hello-temporal/src/workflows.ts`
   - Temporal tìm function này để execute

2. **`taskQueue: 'workflow-task-queue'`**
   - Queue name mà Workers listen
   - Workers phải config cùng taskQueue mới nhận được tasks
   - **Ví dụ:**
     ```
     Backend --[task]--> Task Queue "workflow-task-queue"
                              ↓
                         Worker listening
                              ↓
                         Execute activities
     ```

3. **`workflowId`**
   - Unique ID cho workflow execution này
   - Format: `{workflowDefinitionId}-{trigger}-{timestamp}`
   - Ví dụ: `693ba5dcbb9af2ecdcaa674a-manual-1766181234567`
   - **Tại sao cần unique?**
     - Temporal dùng để track execution state
     - Có thể query/terminate workflow bằng ID này

4. **`args: [workflow._id, activities, inputData]`**
   - Arguments truyền vào workflow function
   - **Mapping:**
     ```typescript
     // Backend gọi:
     args: [workflow._id, activities, inputData]
     
     // Worker nhận:
     export async function executeWorkflow(
       workflowId: string,        // args[0]
       activities: Activity[],    // args[1]
       contextData?: any          // args[2]
     ) { ... }
     ```

##### Save Workflow Run
```typescript
const workflowRun = new WorkflowRun({
  workflowId: workflow._id,
  temporalWorkflowId: workflowId,
  status: 'running',
  startedAt: new Date(),
  inputData,
});
await workflowRun.save();
```

**Tại sao cần WorkflowRun collection?**
- Track execution history
- Hiển thị trên UI (Execution History tab)
- Debug: Xem input data, output, errors
- Analytics: Đếm số lần execute, success rate

**WorkflowRun schema:**
```typescript
{
  workflowId: ObjectId,           // Reference to Workflow
  temporalWorkflowId: String,     // Temporal execution ID
  status: 'running' | 'completed' | 'failed',
  startedAt: Date,
  completedAt?: Date,
  inputData?: any,
  outputData?: any,
  error?: String
}
```

---

### 🪝 1.6 Webhook Endpoint - Telegram/HTTP Triggers

```typescript
app.post('/webhooks/:webhookId', async (req: Request, res: Response) => {
  const { webhookId } = req.params;
  const payload = req.body;
  
  try {
    // Log webhook request
    console.log(`[Webhook ${webhookId}] Received:`, JSON.stringify(payload, null, 2));
    
    // Find workflow by webhook URL
    const workflow = await Workflow.findOne({ webhookUrl: `/webhooks/${webhookId}` });
    if (!workflow) {
      console.log(`[Webhook] ❌ No workflow found for ${webhookId}`);
      return res.status(404).json({ error: 'Webhook not registered' });
    }
    
    // Check if workflow is published
    if (workflow.status !== 'published') {
      console.log(`[Webhook] ⚠️ Workflow ${workflow.name} is not published`);
      return res.status(400).json({ error: 'Workflow not published' });
    }
    
    // Parse Telegram payload
    let contextData: any = {};
    if (payload.message) {
      // Telegram webhook
      contextData.webhook = {
        type: 'telegram',
        message: payload.message,
        chat: payload.message.chat,
        from: payload.message.from,
        text: payload.message.text,
        timestamp: new Date(payload.message.date * 1000).toISOString(),
      };
    } else {
      // Generic HTTP webhook
      contextData.webhook = payload;
    }
    
    // Convert workflow to Temporal activities
    const nodes = workflow.reactFlowData?.nodes || [];
    const edges = workflow.reactFlowData?.edges || [];
    const activities = convertWorkflowToTemporal(nodes, edges, contextData);
    
    // Start Temporal workflow
    if (!temporalClient) {
      return res.status(503).json({ error: 'Temporal unavailable' });
    }
    
    const workflowId = `${workflow._id}-webhook-${Date.now()}`;
    const handle = await temporalClient.workflow.start('executeWorkflow', {
      taskQueue: 'workflow-task-queue',
      workflowId,
      args: [workflow._id.toString(), activities, contextData],
    });
    
    console.log(`[Webhook] ✅ Started workflow: ${workflowId}`);
    
    // Respond quickly (Telegram requires response < 5s)
    return res.json({ success: true, workflowId });
  } catch (error: any) {
    console.error(`[Webhook] ❌ Error:`, error);
    return res.status(500).json({ error: error.message });
  }
});
```

**Phân tích chi tiết:**

##### Webhook ID Routing
```typescript
app.post('/webhooks/:webhookId', ...)
```

**URL examples:**
- `POST /webhooks/whk_559892d1a3a851fe`
- `POST /webhooks/telegram-bot-123`

**Làm thế nào Telegram gọi endpoint này?**
1. Admin setup webhook: `setWebhook?url=https://domain.com/webhooks/whk_xxx`
2. User gửi tin nhắn đến bot
3. Telegram server POST data đến URL đã set
4. Backend nhận request → trigger workflow

##### Find Workflow by Webhook URL
```typescript
const workflow = await Workflow.findOne({ webhookUrl: `/webhooks/${webhookId}` });
```

**Tại sao query theo webhookUrl thay vì _id?**
- Webhook URL là unique (indexed)
- Client (Telegram) không biết workflow `_id`, chỉ biết URL
- **Schema design:**
  ```typescript
  const WorkflowSchema = new Schema({
    webhookUrl: { type: String, unique: true, sparse: true },
    // sparse: true → allow null, nhưng nếu có value thì phải unique
  });
  ```

##### Parse Telegram Payload
```typescript
if (payload.message) {
  // Telegram webhook
  contextData.webhook = {
    type: 'telegram',
    message: payload.message,
    text: payload.message.text,
    ...
  };
}
```

**Telegram payload structure:**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 456,
    "from": {
      "id": 8475393129,
      "first_name": "John",
      "username": "john_doe"
    },
    "chat": {
      "id": 8475393129,
      "type": "private"
    },
    "date": 1766181234,
    "text": "Hello bot"
  }
}
```

**Variables available trong workflow:**
- `{{webhook.message.text}}` → "Hello bot"
- `{{webhook.message.chat.id}}` → 8475393129
- `{{webhook.message.from.first_name}}` → "John"

##### Fast Response Requirement
```typescript
return res.json({ success: true, workflowId });
```

**Tại sao respond nhanh?**
- Telegram timeout webhook sau **5 giây**
- Nếu không response kịp → Telegram retry nhiều lần → duplicate workflows!
- **Best practice:**
  1. Nhận webhook → respond ngay
  2. Execute workflow async (Temporal handle việc này)
  3. Workflow có thể chạy 10 phút, 1 giờ... không sao

---

## 🔄 File 2: `workflow-converter.ts` - ReactFlow → Temporal Converter

### 📌 Tổng Quan
File này **cực kỳ quan trọng**, chịu trách nhiệm:
- Convert visual workflow (nodes + edges) → Temporal activity sequence
- Resolve template variables `{{nodeId.field}}`
- Handle conditional routing (Content Filter PASS/REJECT)
- Validate workflow trước khi execute

---

### 🧩 2.1 Type Definitions

```typescript
export interface TemporalActivityConfig {
  nodeId: string;           // ID của node trong ReactFlow
  activityName: string;     // Tên activity function trong worker
  nodeType: string;         // Type của node (groq, telegram, ...)
  config: any;              // Config data của node
  order: number;            // Thứ tự thực thi (0, 1, 2, ...)
  inputs?: Record<string, any>;
  condition?: {
    sourceNode: string;      // Node trigger condition
    sourceHandle: string;    // Handle name (PASS/REJECT)
  };
}
```

**Ví dụ TemporalActivityConfig:**
```javascript
{
  nodeId: 'groq-1766181234567',
  activityName: 'callGroq',
  nodeType: 'groq',
  config: {
    model: 'llama-3.3-70b-versatile',
    systemPrompt: 'Bạn là chatbot...',
    userMessage: '{{webhook.message.text}}',
    chatId: '{{webhook.message.chat.id}}'
  },
  order: 0
}
```

---

### 🔍 2.2 Template Variable Evaluation

```typescript
function evaluateTemplate(
  template: string,
  previousResults: Record<string, any>
): string {
  if (!template || typeof template !== 'string') {
    return template;
  }
  
  const variablePattern = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/g;
  
  return template.replace(variablePattern, (match, nodeId, path) => {
    let nodeResult = previousResults[nodeId];
    
    // Try exact match first
    if (!nodeResult) {
      // Try prefix match: "groq-1" matches "groq-1766181234567"
      const matchingKey = Object.keys(previousResults).find(key => 
        key.startsWith(nodeId + '-')
      );
      if (matchingKey) {
        nodeResult = previousResults[matchingKey];
        console.log(`[Converter] 🔍 Found node by prefix: ${nodeId} -> ${matchingKey}`);
      }
    }
    
    if (!nodeResult) {
      console.warn(`Node result not found: ${nodeId}`);
      return match; // Keep original if not found
    }
    
    // Navigate nested path
    const pathParts = path.split('.');
    let value = nodeResult;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`Path not found: ${nodeId}.${path}`);
        return match;
      }
    }
    
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}
```

**Phân tích regex:**

```typescript
const variablePattern = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/g;
```

**Regex breakdown:**
- `\{\{` → Literal `{{`
- `([a-zA-Z0-9_-]+)` → **Group 1: Node ID** (groq-1, filter-2, ...)
- `\.` → Literal `.`
- `([a-zA-Z0-9_.]+)` → **Group 2: Field path** (response, data.user.name, ...)
- `\}\}` → Literal `}}`
- `g` → Global flag (tìm tất cả matches)

**Ví dụ matches:**
```javascript
const template = "Hello {{webhook.message.from.first_name}}, your score is {{groq-1.score}}";

// Match 1:
// - Full match: "{{webhook.message.from.first_name}}"
// - Group 1 (nodeId): "webhook"
// - Group 2 (path): "message.from.first_name"

// Match 2:
// - Full match: "{{groq-1.score}}"
// - Group 1 (nodeId): "groq-1"
// - Group 2 (path): "score"
```

**Prefix matching logic:**
```typescript
const matchingKey = Object.keys(previousResults).find(key => 
  key.startsWith(nodeId + '-')
);
```

**Tại sao cần prefix matching?**
- User viết: `{{groq-1.response}}`
- Actual nodeId: `groq-1766181234567` (có timestamp)
- Phải match flexible: `"groq-1"` → `"groq-1766181234567"`

**Nested path navigation:**
```typescript
const pathParts = path.split('.');  // "message.from.first_name" → ["message", "from", "first_name"]
let value = nodeResult;

for (const part of pathParts) {
  if (value && typeof value === 'object' && part in value) {
    value = value[part];
  } else {
    return match; // Path not found, keep original
  }
}
```

**Ví dụ:**
```javascript
// nodeResult:
{
  message: {
    from: {
      first_name: "John"
    }
  }
}

// Path: "message.from.first_name"
// Step 1: value = nodeResult.message
// Step 2: value = value.from
// Step 3: value = value.first_name → "John" ✅
```

---

### 🎯 2.3 Main Conversion Function

```typescript
export function convertWorkflowToTemporal(
  nodes: Node[],
  edges: Edge[],
  previousResults: Record<string, any> = {}
): TemporalActivityConfig[] {
  const activities: TemporalActivityConfig[] = [];
  
  if (edges.length > 0) {
    // Follow edges từ start node
    const startNode = nodes.find(n => n.type === 'input');
    if (startNode) {
      const visited = new Set<string>();
      const executionOrder: string[] = [];
      const nodeConditions: Map<string, { sourceNode: string; sourceHandle: string }> = new Map();
      
      function traverse(nodeId: string, inheritedCondition?: any) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        executionOrder.push(nodeId);
        
        // Find outgoing edges
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          let conditionToPropagate = inheritedCondition;

          // Edge có sourceHandle? (ví dụ: PASS/REJECT)
          if (edge.sourceHandle) {
            console.log(`[Converter] 🔀 Edge condition: ${edge.source} --[${edge.sourceHandle}]--> ${edge.target}`);
            conditionToPropagate = {
              sourceNode: edge.source,
              sourceHandle: edge.sourceHandle,
            };
            nodeConditions.set(edge.target, conditionToPropagate);
          } else if (inheritedCondition && !nodeConditions.has(edge.target)) {
            console.log(`[Converter] 🔁 Propagating condition to ${edge.target}`);
            nodeConditions.set(edge.target, inheritedCondition);
            conditionToPropagate = inheritedCondition;
          }

          traverse(edge.target, conditionToPropagate);
        });
      }
      
      traverse(startNode.id);
      
      // Convert nodes theo execution order
      let order = 0;
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type === 'input' || node.type === 'output') {
          continue;
        }
        
        const activity = convertNodeToActivity(node, order++, previousResults);
        if (activity) {
          const condition = nodeConditions.get(nodeId);
          if (condition) {
            activity.condition = condition;
            console.log(`[Converter] 🔗 Activity ${activity.activityName} has condition: ${condition.sourceNode} -> ${condition.sourceHandle}`);
          }
          activities.push(activity);
        }
      }
    }
  }
  
  return activities;
}
```

**Phân tích thuật toán:**

##### Graph Traversal (DFS)
```typescript
function traverse(nodeId: string, inheritedCondition?: any) {
  if (visited.has(nodeId)) return;  // Prevent cycles
  visited.add(nodeId);
  executionOrder.push(nodeId);
  
  const outgoingEdges = edges.filter(e => e.source === nodeId);
  outgoingEdges.forEach(edge => {
    traverse(edge.target, conditionToPropagate);
  });
}
```

**Ví dụ workflow graph:**
```
Start → Groq AI → Content Filter ─┬─[PASS]─→ Telegram
                                   └─[REJECT]─→ Google Sheets
```

**Traversal steps:**
1. `traverse('start')` → push 'start'
2. `traverse('groq-1')` → push 'groq-1'
3. `traverse('filter-1')` → push 'filter-1'
4. `traverse('telegram-1')` → push 'telegram-1', save condition PASS
5. `traverse('sheets-1')` → push 'sheets-1', save condition REJECT

**Kết quả executionOrder:**
```javascript
['start', 'groq-1', 'filter-1', 'telegram-1', 'sheets-1']
```

##### Condition Propagation
```typescript
if (edge.sourceHandle) {
  conditionToPropagate = {
    sourceNode: edge.source,
    sourceHandle: edge.sourceHandle,
  };
  nodeConditions.set(edge.target, conditionToPropagate);
}
```

**Ví dụ:**
```javascript
// Edge: filter-1 --[REJECT]--> sheets-1
nodeConditions.set('sheets-1', {
  sourceNode: 'filter-1',
  sourceHandle: 'REJECT'
});

// Khi execute sheets-1, worker check:
// if (filter-1.result === 'REJECT') { execute sheets }
```

---

### 🔧 2.4 Node to Activity Conversion

```typescript
function convertNodeToActivity(
  node: Node,
  order: number,
  previousResults: Record<string, any>
): TemporalActivityConfig | null {
  const nodeType = node.type;
  const nodeData = node.data;
  
  // Evaluate templates in config
  const evaluatedConfig = evaluateConfigTemplates(nodeData, previousResults);
  
  // Map node type to activity name
  const activityMapping: Record<string, string> = {
    'httpRequest': 'executeHttpRequestActivity',
    'database': 'executeDatabaseActivity',
    'email': 'sendEmailActivity',
    'delay': 'delayActivity',
    'telegram': 'sendTelegramMessage',
    'groq': 'callGroq',
    'gemini': 'callGemini',
    'chatgpt': 'callChatGPT',
    'contentFilter': 'filterContent',
    'googleSheets': 'googleSheetsOperation',
  };
  
  const activityName = activityMapping[nodeType];
  if (!activityName) {
    console.warn(`[Converter] Unknown node type: ${nodeType}`);
    return null;
  }
  
  return {
    nodeId: node.id,
    activityName,
    nodeType,
    config: evaluatedConfig,
    order,
  };
}
```

**Activity Mapping Table:**

| Node Type | Activity Function | Worker File |
|-----------|------------------|-------------|
| `groq` | `callGroq` | activities.ts |
| `telegram` | `sendTelegramMessage` | activities.ts |
| `googleSheets` | `googleSheetsOperation` | activities.ts |
| `contentFilter` | `filterContent` | activities.ts |
| `httpRequest` | `executeHttpRequestActivity` | activities.ts |
| `email` | `sendEmailActivity` | activities.ts |

**Tại sao cần mapping?**
- Frontend dùng node types: `groq`, `telegram`
- Worker dùng function names: `callGroq`, `sendTelegramMessage`
- Converter làm cầu nối giữa 2 bên

---

## 💾 File 3: `mongodb.service.ts` - MongoDB Connection Manager

### 📌 Singleton Pattern

```typescript
class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;

  private constructor() {}  // Private constructor → không thể new từ bên ngoài

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }
}
```

**Singleton pattern là gì?**
- **Mục đích:** Đảm bảo class chỉ có **DUY NHẤT 1 instance** trong toàn bộ app
- **Use case:** Database connections, Config managers, Loggers

**Tại sao MongoDB cần Singleton?**
```javascript
// ❌ KHÔNG DÙNG SINGLETON:
// Mỗi lần import, tạo connection mới
import MongoDBService from './mongodb.service';
const db1 = new MongoDBService(); // Connection pool 1
const db2 = new MongoDBService(); // Connection pool 2
// → Lãng phí connections, vượt quá MongoDB limit!

// ✅ DÙNG SINGLETON:
const db1 = MongoDBService.getInstance(); // Tạo instance lần đầu
const db2 = MongoDBService.getInstance(); // Trả về instance cũ
// → Chỉ 1 connection pool, reuse cho tất cả requests
```

---

### 🔌 Connection Method

```typescript
async connect(config: MongoDBConfig): Promise<void> {
  if (this.isConnected) {
    logger.info('MongoDB đã được kết nối');
    return;
  }

  try {
    await mongoose.connect(config.uri, {
      dbName: config.dbName,
      maxPoolSize: config.maxPoolSize || 10,
      minPoolSize: config.minPoolSize || 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    this.isConnected = true;
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB bị ngắt kết nối');
      this.isConnected = false;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB Connection Error:', error);
      this.isConnected = false;
    });
  } catch (error) {
    logger.error('❌ Lỗi kết nối MongoDB:', error);
    throw error;
  }
}
```

**Mongoose connect options:**

##### 1. Connection Pooling
```typescript
maxPoolSize: 10,
minPoolSize: 5,
```

**Connection pool là gì?**
- Pool = tập hợp connections tái sử dụng
- Thay vì tạo connection mới mỗi query → lấy connection từ pool

**Ví dụ:**
```
Request 1 → Get connection from pool → Execute query → Return to pool
Request 2 → Get connection from pool → Execute query → Return to pool
...
Request 100 → Wait for available connection (nếu pool full)
```

**Tại sao cần pool?**
- Tạo connection mới = chậm (TCP handshake, auth...)
- Reuse connection = nhanh
- Limit connections → tránh overwhelm database

##### 2. Timeouts
```typescript
serverSelectionTimeoutMS: 5000,   // Timeout khi chọn server (replica set)
socketTimeoutMS: 45000,            // Timeout khi đợi response từ server
```

**serverSelectionTimeoutMS:**
- Khi connect MongoDB Atlas (replica set), driver phải chọn server nào (primary/secondary)
- Nếu không chọn được trong 5s → throw error
- **Use case:** Detect MongoDB offline nhanh

**socketTimeoutMS:**
- Timeout cho từng query/operation
- Ví dụ: Query chạy quá lâu (> 45s) → cancel để tránh hang

---

### 🎧 Event Listeners

```typescript
mongoose.connection.on('disconnected', () => {
  this.isConnected = false;
});

mongoose.connection.on('error', (error) => {
  this.isConnected = false;
});
```

**Mongoose connection events:**
- `connected` - Successfully connected
- `disconnected` - Lost connection
- `error` - Connection/query error
- `reconnected` - Reconnected after disconnect

**Tại sao cần event listeners?**
- Update `isConnected` flag → frontend biết DB status
- Auto-reconnect logic (Mongoose tự động reconnect)
- Logging để debug connection issues

---

## 🎓 Best Practices & Patterns

### 1. Error Handling

```typescript
// ❌ BAD: Swallow errors
try {
  await workflow.save();
} catch (error) {
  // Nothing → silent failure!
}

// ✅ GOOD: Log + re-throw hoặc respond error
try {
  await workflow.save();
} catch (error: any) {
  console.error('Failed to save workflow:', error);
  return res.status(500).json({ 
    error: 'Failed to save workflow',
    message: error.message 
  });
}
```

### 2. Async/Await

```typescript
// ❌ BAD: Callback hell
Workflow.findById(id, (err, workflow) => {
  if (err) { ... }
  workflow.save((err) => {
    if (err) { ... }
    WorkflowRun.create({ ... }, (err) => {
      // 😱 Nested callbacks
    });
  });
});

// ✅ GOOD: Async/await
try {
  const workflow = await Workflow.findById(id);
  await workflow.save();
  await WorkflowRun.create({ ... });
} catch (error) {
  // Handle error
}
```

### 3. HTTP Status Codes

```typescript
// Success responses
200 OK          - GET/PUT success
201 Created     - POST success (resource created)
204 No Content  - DELETE success (no response body)

// Client errors
400 Bad Request       - Invalid input
401 Unauthorized      - Not authenticated
403 Forbidden         - Authenticated but no permission
404 Not Found         - Resource doesn't exist
409 Conflict          - Resource already exists

// Server errors
500 Internal Error    - Unexpected error
503 Service Unavailable - Dependency down (Temporal, MongoDB)
```

### 4. Variable Resolution Order

```typescript
// 1. Exact match
previousResults['groq-1766181234567']

// 2. Prefix match
Object.keys(previousResults).find(k => k.startsWith('groq-1'))

// 3. Keep original if not found
return match; // "{{groq-1.response}}"
```

---

## 📝 Tóm Tắt Kiến Thức

### Core Concepts

1. **Express Server:**
   - Middleware pipeline: CORS → JSON parser → Route handlers
   - RESTful API design: GET/POST/PUT/DELETE
   - Error handling: try-catch + proper status codes

2. **MongoDB with Mongoose:**
   - Singleton connection service
   - Schema validation
   - Query methods: find, findById, findByIdAndUpdate
   - Connection pooling & timeouts

3. **Temporal Integration:**
   - Client để trigger workflows
   - Task queues để distribute work
   - Workflow IDs để track executions

4. **Workflow Conversion:**
   - ReactFlow (visual) → Temporal (execution)
   - Template variable resolution
   - Conditional routing với sourceHandle

5. **Webhook Handling:**
   - Fast response (< 5s)
   - Async execution với Temporal
   - Telegram payload parsing

---

**Next Steps:**
- Đọc `FRONTEND_CODE_EXPLAINED.md` để hiểu React app
- Đọc `WORKER_CODE_EXPLAINED.md` để hiểu Temporal activities
- Thực hành: Tạo custom node type mới

**Questions?**
- Tại sao dùng Temporal thay vì queue (RabbitMQ, Redis)?
  → Guaranteed execution, retry logic built-in, workflow state persistence

- Khi nào dùng Mongoose vs native MongoDB driver?
  → Mongoose: schema validation, middleware hooks, easier querying
  → Native: performance critical, no schema needed


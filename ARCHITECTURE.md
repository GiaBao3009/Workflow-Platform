# 🏗️ ARCHITECTURE & BEST PRACTICES

## 📚 DATABASE SCHEMA DESIGN

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  isActive: Boolean,
  organizationId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
- email (unique)
- organizationId
```

**Use Case:** Quản lý authentication & authorization

---

### Workflows Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref Users),
  name: String,
  description: String,
  status: String ('draft' | 'published' | 'archived'),
  isArchived: Boolean,
  triggerType: String ('MANUAL' | 'WEBHOOK' | 'CRON'),
  webhookUrl: String (unique, sparse),
  cronExpression: String,
  
  // Frontend data
  reactFlowData: {
    nodes: [
      {
        id: String,
        type: String,
        position: { x: Number, y: Number },
        data: { config: Object }
      }
    ],
    edges: [
      {
        id: String,
        source: String,
        target: String
      }
    ],
    viewport: { x: Number, y: Number, zoom: Number }
  },
  
  // Backend execution plan
  temporalConfig: [
    {
      nodeId: String,
      activityName: String,
      nodeType: String,
      config: Object,
      successors: [String],
      retryPolicy: {
        maxAttempts: Number,
        backoffMultiplier: Number,
        initialInterval: Number,
        maxInterval: Number
      }
    }
  ],
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
- userId, createdAt
- status
- webhookUrl (unique)
```

**Use Case:** Lưu workflow design & execution plan

**Quy trình:**
1. User thiết kế workflow bằng React Flow
2. React Flow data được lưu as-is (để reload UI)
3. Backend convert thành `temporalConfig` (optimized cho execution)
4. Cả hai đều được lưu → flexibility & auditability

---

### Workflow Runs Collection
```javascript
{
  _id: ObjectId,
  workflowId: ObjectId (ref Workflows),
  temporalWorkflowId: String (unique),
  temporalRunId: String,
  
  startTime: Date,
  endTime: Date,
  status: String ('RUNNING' | 'SUCCESS' | 'FAILURE' | 'TERMINATED'),
  
  triggerContext: Object,  // Webhook payload, input data, etc
  
  executionDetails: [
    {
      activityName: String,
      status: String ('SUCCESS' | 'FAILURE'),
      output: Object,
      error: { message: String, code: String },
      executionTime: Number
    }
  ],
  
  errorDetails: {
    message: String,
    stack: String,
    failedActivityName: String
  },
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
- workflowId, createdAt (để list runs của 1 workflow)
- status (để filter by status)
- temporalWorkflowId (unique, để lookup)
- startTime (để range queries)
```

**Use Case:** Audit trail & monitoring

---

## 🔄 DATA FLOW & TIMING DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ T=0s: User saves workflow in Frontend                           │
├─────────────────────────────────────────────────────────────────┤
│ Frontend:                                                        │
│  - Capture React Flow data (nodes + edges)                     │
│  - Send to Backend: POST /api/workflows                        │
│  - Display: "Saving..."                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (POST request)
┌──────────────────────▼──────────────────────────────────────────┐
│ T=0.1s: Backend processes workflow save                         │
├─────────────────────────────────────────────────────────────────┤
│ Backend:                                                         │
│  1. Receive React Flow data                                    │
│  2. Convert to Temporal config:                                │
│     - Extract nodes in dependency order                        │
│     - Map nodeType → activityName                              │
│     - Extract config from node.data                            │
│     - Build successors array from edges                        │
│  3. Save to MongoDB:                                           │
│     - reactFlowData (original)                                 │
│     - temporalConfig (normalized)                              │
│  4. Return workflowId                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (Response)
┌──────────────────────▼──────────────────────────────────────────┐
│ T=0.2s: Frontend receives workflowId                            │
├─────────────────────────────────────────────────────────────────┤
│ Frontend:                                                        │
│  - Show: "Workflow saved! ID: {id}"                            │
│  - Enable "Publish" button                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ T=5s: User publishes workflow                                   │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: POST /api/workflows/{id}/publish                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ Backend:                                                         │
│  - Update status: draft → published                            │
│  - Save to MongoDB                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ T=10s: User clicks "Execute"                                    │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: POST /api/workflows/{id}/execute                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (POST request)
┌──────────────────────▼──────────────────────────────────────────┐
│ T=10.1s: Backend starts Temporal workflow                       │
├─────────────────────────────────────────────────────────────────┤
│ Backend:                                                         │
│  1. Get workflow from MongoDB                                  │
│  2. Create WorkflowRun record (status: RUNNING)                │
│  3. Call Temporal Client:                                      │
│     workflow.start('executeWorkflow', {                        │
│       args: [workflowId, temporalConfig],                      │
│       taskQueue: 'default',                                    │
│       workflowId: unique-id                                    │
│     })                                                         │
│  4. Return runId (202 Accepted)                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (Response with runId)
┌──────────────────────▼──────────────────────────────────────────┐
│ Frontend: Poll /api/workflow-runs/{runId}                       │
│  - Show: "Running... 0% complete"                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ T=10.2s: Temporal Server assigns task to Worker                 │
├─────────────────────────────────────────────────────────────────┤
│ Temporal:                                                        │
│  - Workflow registered in task queue                           │
│  - Waiting for Worker to poll                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ T=10.3s: Worker polls & receives workflow task                  │
├─────────────────────────────────────────────────────────────────┤
│ Worker:                                                          │
│  - Poll from taskQueue: 'default'                              │
│  - Receive: executeWorkflow task                               │
│  - Parse: [workflowId, temporalConfig]                         │
│  - Start execution loop                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ T=10.4s-15s: Execute activities sequentially                    │
├─────────────────────────────────────────────────────────────────┤
│ Activity 1: ACTION_HTTP_REQUEST                                │
│   - POST https://api.example.com/data                          │
│   - Response: { statusCode: 200, body: {...} }                 │
│                                                                 │
│ Activity 2: DATABASE_MONGO_WRITE                               │
│   - Insert document into 'orders' collection                   │
│   - Response: { insertedId: xxx }                              │
│                                                                 │
│ Activity 3: DELAY (optional)                                   │
│   - Sleep 2 seconds                                            │
│   - Response: { delayMs: 2000 }                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ T=15s: Workflow completes                                       │
├─────────────────────────────────────────────────────────────────┤
│ Worker:                                                          │
│  - All activities succeeded                                    │
│  - Return result to Temporal                                   │
│  - Result = { node-1: {...}, node-2: {...}, node-3: {...} }  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (Update status)
┌──────────────────────▼──────────────────────────────────────────┐
│ Temporal Server:                                                 │
│  - Mark workflow as COMPLETED                                  │
│  - Store result in Temporal storage                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ Backend (via update):                                            │
│  - WorkflowRun status: RUNNING → SUCCESS                        │
│  - Save endTime, result                                        │
│  - MongoDB update                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ Frontend (polling):                                              │
│  - Detects status change to SUCCESS                             │
│  - Show: "Completed! 100%"                                     │
│  - Display result in detail panel                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 REACT FLOW → TEMPORAL CONFIG CONVERSION

### Example React Flow Data:
```json
{
  "nodes": [
    {
      "id": "http-1",
      "type": "ACTION_HTTP_REQUEST",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Fetch Orders",
        "config": {
          "url": "https://api.shop.com/orders",
          "method": "GET",
          "headers": { "Authorization": "Bearer token" }
        }
      }
    },
    {
      "id": "db-1",
      "type": "DATABASE_MONGO_WRITE",
      "position": { "x": 300, "y": 0 },
      "data": {
        "label": "Save to DB",
        "config": {
          "collection": "processed_orders",
          "operation": "insertMany",
          "data": "{{$json.http-1.body}}"  // Variable reference
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "http-1",
      "target": "db-1"
    }
  ]
}
```

### Converted Temporal Config:
```json
[
  {
    "nodeId": "http-1",
    "activityName": "executeHttpRequestActivity",
    "nodeType": "ACTION_HTTP_REQUEST",
    "config": {
      "url": "https://api.shop.com/orders",
      "method": "GET",
      "headers": { "Authorization": "Bearer token" }
    },
    "successors": ["db-1"],
    "retryPolicy": {
      "maxAttempts": 3,
      "backoffMultiplier": 2,
      "initialInterval": 1000,
      "maxInterval": 32000
    }
  },
  {
    "nodeId": "db-1",
    "activityName": "mongoDBWriteActivity",
    "nodeType": "DATABASE_MONGO_WRITE",
    "config": {
      "collection": "processed_orders",
      "operation": "insertMany",
      "data": "{{$json.http-1.body}}"
    },
    "successors": [],
    "retryPolicy": {
      "maxAttempts": 3,
      "backoffMultiplier": 2,
      "initialInterval": 1000,
      "maxInterval": 32000
    }
  }
]
```

### Conversion Logic:
```typescript
function convertReactFlowToTemporalConfig(reactFlowData) {
  const { nodes, edges } = reactFlowData;
  
  // Map edges to successors
  const successorMap = {};
  edges.forEach(edge => {
    if (!successorMap[edge.source]) successorMap[edge.source] = [];
    successorMap[edge.source].push(edge.target);
  });
  
  // Convert nodes
  return nodes
    .filter(n => n.type !== 'note')
    .map(node => ({
      nodeId: node.id,
      activityName: nodeTypeToActivityName(node.type),
      nodeType: node.type,
      config: node.data.config || {},
      successors: successorMap[node.id] || [],
      retryPolicy: defaultRetryPolicy()
    }))
    .sort(topologicalSort);  // Important: execute in correct order
}
```

---

## 🔐 SECURITY BEST PRACTICES

### 1. **Workflow Isolation**
```typescript
// Always validate ownership
const workflow = await Workflow.findOne({
  _id: workflowId,
  userId: req.user.id  // ← Critical: Verify user owns this workflow
});
```

### 2. **Activity Timeout & Retry**
```json
{
  "retryPolicy": {
    "maxAttempts": 3,
    "backoffMultiplier": 2,
    "initialInterval": 1000,
    "maxInterval": 32000
  }
}
```
- Prevent infinite loops
- Graceful degradation

### 3. **Sensitive Data in Config**
```typescript
// ❌ BAD: Store secrets in workflow
const config = {
  dbPassword: "secret123"  // Exposed in MongoDB!
};

// ✅ GOOD: Reference from environment
const config = {
  dbConnection: "ref:MONGO_URI"  // Load from env at runtime
};
```

### 4. **Rate Limiting**
```typescript
// Prevent workflow spam
const MAX_RUNS_PER_HOUR = 100;
const runs = await WorkflowRun.countDocuments({
  workflowId,
  createdAt: { $gte: oneHourAgo }
});
if (runs > MAX_RUNS_PER_HOUR) {
  throw new Error('Rate limit exceeded');
}
```

---

## 📊 MONITORING & OBSERVABILITY

### 1. **Temporal UI Dashboard**
- URL: `http://localhost:8080`
- Monitor running workflows
- View execution history
- Debug failed activities

### 2. **MongoDB Metrics**
```typescript
// Track workflow statistics
const stats = await WorkflowRun.aggregate([
  {
    $group: {
      _id: '$workflowId',
      totalRuns: { $sum: 1 },
      successCount: {
        $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
      },
      failureCount: {
        $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
      },
      avgExecutionTime: {
        $avg: {
          $subtract: ['$endTime', '$startTime']
        }
      }
    }
  }
]);
```

### 3. **Logging Strategy**
```typescript
// Structure logs
console.log({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  component: 'backend',
  workflowId,
  runId,
  message: 'Workflow started',
  metadata: { activityCount: 5 }
});
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### 1. **Activity Parallelization**
```typescript
// ❌ Sequential (slow)
const result1 = await activity1();
const result2 = await activity2();

// ✅ Parallel (fast)
const [result1, result2] = await Promise.all([
  activity1(),
  activity2()
]);
```

### 2. **Database Indexing**
```javascript
// Add indexes for common queries
db.workflows.createIndex({ userId: 1, status: 1 });
db.workflow_runs.createIndex({ workflowId: 1, createdAt: -1 });
db.workflow_runs.createIndex({ status: 1 });
```

### 3. **Batch Processing**
```typescript
// Process multiple workflows efficiently
const workflows = await Workflow.find({ status: 'published' }).limit(100);
await Promise.all(workflows.map(w => executeWorkflow(w)));
```

---

## 🏗️ DEPLOYMENT CHECKLIST

- [ ] MongoDB Atlas setup
- [ ] Environment variables configured
- [ ] Docker images built & tested
- [ ] Health checks implemented
- [ ] Logging configured
- [ ] Monitoring & alerting setup
- [ ] Backup strategy defined
- [ ] Disaster recovery plan
- [ ] Security audit completed
- [ ] Load testing passed

---

## 📖 NEXT STEPS

1. **Frontend Development**
   - Build React Flow UI
   - Implement drag-drop
   - Node editor panels

2. **Advanced Features**
   - Conditional branching
   - Loop constructs
   - Error handling branches

3. **Scaling**
   - Multiple workers
   - Load balancing
   - Sharding strategies

Happy building! 🚀

# 🚀 BUILD WORKFLOW PLATFORM - HƯỚNG DẪN CHI TIẾT

## 📌 TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React Flow)                     │
│              - Drag & drop để design workflow                    │
│              - Tạo nodes (HTTP, DB, Conditional, etc)           │
│              - Connect nodes bằng edges                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ (Save workflow)
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND API (Express)                         │
│              - CRUD workflows                                    │
│              - Convert React Flow → Temporal Config              │
│              - Trigger workflow execution                        │
│              - Fetch execution results                           │
└────────────────┬──────────────────────────────┬──────────────────┘
                 │                              │
          (Temporal API)                 (Query/Insert)
                 │                              │
    ┌────────────▼──────────────┐      ┌────────▼──────────────┐
    │   TEMPORAL SERVER          │      │   MONGODB ATLAS       │
    │  (Orchestrator)            │      │  (Data Storage)       │
    │  - Manages workflows       │      │  - Users              │
    │  - Retry logic             │      │  - Workflows          │
    │  - Schedule execution      │      │  - Workflow Runs      │
    └────────┬───────────────────┘      └─────────────────────────┘
             │
    ┌────────▼──────────────┐
    │  TEMPORAL WORKER       │
    │  (Activity Runner)     │
    │  - HTTP requests       │
    │  - DB operations       │
    │  - Conditional logic   │
    │  - Delay/Sleep         │
    └───────────────────────┘
```

---

## 📋 BƯỚC 1: SETUP MONGODB ATLAS

### 1.1. Tạo tài khoản
- Vào https://www.mongodb.com/cloud/atlas
- Sign up với email
- Tạo organization (tên: `my-workflow-platform`)

### 1.2. Tạo Cluster
- Click "Create a Deployment"
- Chọn **FREE** tier
- Provider: **AWS**, Region: **Singapore** (hoặc gần nhất)
- Cluster name: `workflow-db`
- Click "Create Deployment"

### 1.3. Tạo Database User
- Vào tab "Security" → "Quick Start"
- Create username: `workflow_user`
- Create password: `YourSecurePassword123`
- **GHI NHỚ USERNAME & PASSWORD**

### 1.4. Whitelist IP
- Vào "Network Access"
- Click "Add IP Address"
- Select "Allow Access from Anywhere" (0.0.0.0/0)
  > ⚠️ **Chỉ cho development, không dùng cho production**

### 1.5. Lấy Connection String
- Vào "Databases" → Cluster của bạn
- Click "Connect"
- Chọn "Drivers"
- Copy connection string:
```
mongodb+srv://workflow_user:YourSecurePassword123@workflow-db.xxxx.mongodb.net/workflow-db?retryWrites=true&w=majority
```

---

## 📋 BƯỚC 2: SETUP ENVIRONMENT VARIABLES

### 2.1. Tạo `.env` file tại root project

```bash
# MONGODB
MONGODB_URI=mongodb+srv://workflow_user:YourSecurePassword123@workflow-db.xxxx.mongodb.net/workflow-db?retryWrites=true&w=majority

# TEMPORAL
TEMPORAL_ADDRESS=localhost:7233

# API
API_URL=http://localhost:3001
NODE_ENV=development

# PORT
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

### 2.2. Update `.env.docker` cho Docker environment
```bash
# Khi chạy trong Docker, máy chủ có hostname khác
TEMPORAL_ADDRESS=temporal:7233
MONGODB_URI=mongodb+srv://workflow_user:YourSecurePassword123@workflow-db.xxxx.mongodb.net/workflow-db?retryWrites=true&w=majority
```

---

## 📋 BƯỚC 3: INSTALL DEPENDENCIES

### 3.1. Root project
```bash
cd c:\Users\baold\Desktop\my-workflow-platform

npm install
```

### 3.2. Backend API
```bash
cd apps/backend-api

npm install
```

**Dependencies cần:**
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "@temporalio/client": "^1.9.0",
  "axios": "^1.4.0",
  "dotenv": "^16.0.3",
  "cors": "^2.8.5",
  "uuid": "^9.0.0"
}
```

### 3.3. Temporal Worker
```bash
cd hello-temporal

npm install
```

**Dependencies cần:**
```json
{
  "@temporalio/worker": "^1.9.0",
  "@temporalio/workflow": "^1.9.0",
  "@temporalio/activity": "^1.9.0",
  "mongodb": "^5.0.0",
  "axios": "^1.4.0"
}
```

### 3.4. Frontend
```bash
cd apps/frontend

npm install
```

**Dependencies cần:**
```json
{
  "react": "^18.2.0",
  "react-flow-renderer": "^10.3.17",
  "axios": "^1.4.0"
}
```

---

## 📋 BƯỚC 4: CẤU HÌNH TYPESCRIPT

Tạo `tsconfig.json` tại mỗi folder:

### 4.1. Backend `apps/backend-api/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 4.2. Worker `hello-temporal/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 📋 BƯỚC 5: SETUP BACKEND API

### 5.1. Tạo main server file `apps/backend-api/src/index.ts`

```typescript
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import MongoDBService from '../../packages/database/mongodb.service';
import workflowRoutes from './routes/workflows';

dotenv.config();

const app: Express = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', workflowRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Start server
async function start() {
  try {
    // Connect MongoDB
    const mongoService = MongoDBService.getInstance();
    await mongoService.connect({
      uri: process.env.MONGODB_URI!,
      dbName: 'workflow-db',
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    app.listen(PORT, () => {
      console.log(`✅ Backend API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

### 5.2. Update `apps/backend-api/package.json`
```json
{
  "name": "backend-api",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "@temporalio/client": "^1.9.0",
    "axios": "^1.4.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## 📋 BƯỚC 6: SETUP TEMPORAL WORKER

### 6.1. Tạo worker entry file `hello-temporal/src/worker.ts`

```typescript
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function startWorker() {
  const worker = await Worker.create({
    connection: {
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    },
    taskQueue: 'default',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  console.log('✅ Temporal Worker started');
  await worker.run();
}

startWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
```

### 6.2. Update `hello-temporal/package.json`
```json
{
  "name": "temporal-worker",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start:worker": "node dist/worker.js"
  },
  "dependencies": {
    "@temporalio/worker": "^1.9.0",
    "@temporalio/workflow": "^1.9.0",
    "@temporalio/activity": "^1.9.0",
    "mongodb": "^5.0.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 📋 BƯỚC 7: CHẠY DOCKER COMPOSE

### 7.1. Build services
```bash
docker-compose build
```

### 7.2. Start services
```bash
docker-compose up -d
```

### 7.3. Verify services
```bash
# Check containers running
docker-compose ps

# View logs
docker-compose logs -f

# Check Temporal UI
http://localhost:8080

# Check Backend Health
http://localhost:3001/health
```

---

## 📋 BƯỚC 8: TẠO WORKFLOW VIA API

### 8.1. Create User
```bash
POST http://localhost:3001/api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "_id": "user-id-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 8.2. Create Workflow
```bash
POST http://localhost:3001/api/workflows
Content-Type: application/json

{
  "userId": "user-id-123",
  "name": "Get Data & Save to DB",
  "reactFlowData": {
    "nodes": [
      {
        "id": "node-1",
        "type": "ACTION_HTTP_REQUEST",
        "position": { "x": 0, "y": 0 },
        "data": {
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET",
            "headers": {}
          }
        }
      },
      {
        "id": "node-2",
        "type": "DATABASE_MONGO_WRITE",
        "position": { "x": 300, "y": 0 },
        "data": {
          "config": {
            "collection": "orders",
            "operation": "insertOne",
            "data": {
              "status": "processed"
            }
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ]
  },
  "triggerType": "MANUAL"
}
```

### 8.3. Publish Workflow
```bash
POST http://localhost:3001/api/workflows/{workflowId}/publish
```

### 8.4. Execute Workflow
```bash
POST http://localhost:3001/api/workflows/{workflowId}/execute
Content-Type: application/json

{
  "inputData": {}
}
```

### 8.5. Check Execution Results
```bash
GET http://localhost:3001/api/workflow-runs/{runId}
```

---

## 🧠 KIẾN TRÚC DATA FLOW

### User tạo Workflow:
1. **Frontend**: User vẽ workflow bằng React Flow
2. **Frontend**: Save → Call `/api/workflows` (POST)
3. **Backend**: Nhận React Flow data
4. **Backend**: Convert thành `temporalConfig` (execution plan)
5. **MongoDB**: Lưu workflow + react flow data + temporal config

### User execute Workflow:
1. **Frontend**: Click "Run" button
2. **Frontend**: Call `/api/workflows/{id}/execute` (POST)
3. **Backend**: Lấy workflow từ MongoDB
4. **Backend**: Start Temporal Workflow
5. **Temporal Server**: Gán task cho Worker
6. **Worker**: Fetch `temporalConfig`
7. **Worker**: Loop qua từng activity:
   - Call activity (HTTP, DB, etc)
   - Lưu result
   - Chuyển sang activity tiếp theo
8. **Worker**: Return final result
9. **Temporal Server**: Update status
10. **Backend**: Save WorkflowRun record
11. **Frontend**: Poll `/api/workflow-runs/{id}` để lấy progress

---

## 🐛 TROUBLESHOOTING

### MongoDB Connection Error
```
Error: MongoServerError: authentication failed
```
**Solution:**
- Kiểm tra MongoDB URI đúng
- Check whitelist IP (allow 0.0.0.0/0)
- Verify username/password

### Temporal Worker không kết nối
```
Error: Connection refused
```
**Solution:**
```bash
# Kiểm tra Temporal Server
docker-compose logs temporal

# Verify port 7233
netstat -an | grep 7233
```

### Activities không chạy
- Check logs trong Temporal UI: http://localhost:8080
- Verify activities được import đúng
- Check `taskQueue` name (phải match)

---

## 📦 PRODUCTION DEPLOYMENT

### Recommendations:
1. **MongoDB**: Dùng Managed Service (MongoDB Atlas)
2. **Temporal**: Dùng Temporal Cloud
3. **Backend**: Deploy trên AWS, GCP, hoặc Azure
4. **Worker**: Deploy trên auto-scaling platform
5. **Frontend**: Deploy trên CDN (Vercel, Netlify)

---

## ✅ CHECKLIST COMPLETION

- [ ] MongoDB Atlas account created
- [ ] Connection string obtained
- [ ] `.env` file configured
- [ ] Dependencies installed
- [ ] Docker Compose running
- [ ] Temporal UI accessible (localhost:8080)
- [ ] Backend health check passing (localhost:3001/health)
- [ ] First workflow created
- [ ] First workflow executed successfully
- [ ] Workflow run visible in Temporal UI

---

Chúc bạn thành công! 🎉

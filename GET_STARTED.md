# 🚀 WORKFLOW PLATFORM - BẮT ĐẦU NGAY

## ✅ CONNECTION STRING ĐÃ CÓ!

```
mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0
```

Đã được lưu trong file `.env` ✅

---

## 📋 BƯỚC 1: KIỂM TRA PREREQUISITES

### Kiểm tra Node.js
```bash
node --version
# Kết quả mong muốn: v18.0.0 trở lên
```

### Kiểm tra Docker
```bash
docker --version
docker ps
# Kết quả: Docker đang chạy
```

### Kiểm tra MongoDB Connection
```bash
mongosh "mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0"
# Kết quả: Kết nối thành công
```

---

## 📋 BƯỚC 2: INSTALL DEPENDENCIES

```bash
# Vào thư mục project
cd c:\Users\baold\Desktop\my-workflow-platform

# Install dependencies chính
npm install

# Install backend dependencies
cd apps\backend-api
npm install
cd ..\..

# Install worker dependencies
cd hello-temporal
npm install
cd ..\..
```

---

## 📋 BƯỚC 3: BUILD SERVICES

```bash
# Build backend
cd apps\backend-api
npm run build
cd ..\..

# Build worker
cd hello-temporal
npm run build
cd ..\..
```

---

## 📋 BƯỚC 4: START DOCKER SERVICES

```bash
# Khởi động tất cả services
docker-compose up -d

# Kiểm tra services đang chạy
docker-compose ps
```

**Kết quả mong muốn:**
```
NAME                   STATUS
temporal-postgresql    Up
temporal-elasticsearch Up
temporal-server        Up
temporal-ui            Up
backend-api            Up
temporal-worker        Up
```

---

## 📋 BƯỚC 5: VERIFY SETUP

### 1. Kiểm tra Temporal UI
```
Vào: http://localhost:8080
Kết quả: Thấy Temporal Dashboard
```

### 2. Kiểm tra Backend Health
```bash
curl http://localhost:3001/health
# Kết quả: {"status":"OK"}
```

### 3. Kiểm tra MongoDB Connection
```bash
mongosh "mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db"

# Trong mongosh:
show dbs
# Kết quả: Thấy workflow-db
```

---

## 🎯 BƯỚC 6: TEST API - CREATE WORKFLOW

Tạo file `test-workflow.sh` (hoặc dùng Postman):

```bash
# 1. Create User
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'

# Response: Sẽ trả về userId
```

Lưu `userId` từ response

```bash
# 2. Create Workflow
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE",
    "name": "Test Workflow",
    "reactFlowData": {
      "nodes": [
        {
          "id": "node-1",
          "type": "ACTION_HTTP_REQUEST",
          "position": {"x": 0, "y": 0},
          "data": {
            "config": {
              "url": "https://jsonplaceholder.typicode.com/posts/1",
              "method": "GET"
            }
          }
        }
      ],
      "edges": [],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    },
    "triggerType": "MANUAL"
  }'

# Response: Sẽ trả về workflowId
```

Lưu `workflowId` từ response

```bash
# 3. Publish Workflow
curl -X POST http://localhost:3001/api/workflows/YOUR_WORKFLOW_ID_HERE/publish

# Response: {"success":true,"status":"published"}
```

```bash
# 4. Execute Workflow
curl -X POST http://localhost:3001/api/workflows/YOUR_WORKFLOW_ID_HERE/execute \
  -H "Content-Type: application/json" \
  -d '{"inputData":{}}'

# Response: {"success":true,"runId":"...","temporalWorkflowId":"..."}
```

Lưu `runId` từ response

```bash
# 5. Get Execution Results
curl http://localhost:3001/api/workflow-runs/YOUR_RUN_ID_HERE

# Response: Sẽ show status, results, etc
```

---

## 🔍 MONITOR EXECUTION

### 1. Temporal UI
Vào: http://localhost:8080
- Tìm workflow ID
- Xem execution history
- Debug failed activities

### 2. MongoDB
```bash
mongosh "your-connection-string"

# View workflows
db.workflows.find()

# View runs
db.workflow_runs.find().sort({createdAt: -1}).limit(5)
```

### 3. Docker Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f temporal
```

---

## ⚠️ TROUBLESHOOTING

### MongoDB Connection Failed
```
Error: MongoServerError: authentication failed
```

✅ **Solution:**
1. Verify connection string
2. Check MongoDB Atlas whitelist IP (Add 0.0.0.0/0)
3. Test: `mongosh "your-connection-string"`

### Temporal Worker Not Connecting
```
Error: Connection refused to temporal:7233
```

✅ **Solution:**
```bash
docker-compose logs temporal
# Verify Temporal server is running
docker-compose ps
```

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Verify .env file exists
cat .env

# Check port 3001
netstat -ano | findstr 3001
```

---

## 📚 NEXT STEPS

### Done ✅
- [x] Setup MongoDB
- [x] Create .env file
- [x] Install dependencies
- [x] Start Docker services
- [x] Create first workflow
- [x] Execute workflow

### Next Steps 🔜
- [ ] Build React frontend (apps/frontend)
- [ ] Add authentication (JWT)
- [ ] Create custom activities
- [ ] Deploy to production

---

## 🎯 IMPORTANT COMMANDS

### Docker
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f [service]

# Rebuild
docker-compose build --no-cache
```

### Node
```bash
# Install
npm install

# Build
npm run build

# Dev
npm run dev

# Start
npm start
```

### MongoDB
```bash
# Connect
mongosh "your-connection-string"

# Show databases
show dbs

# Use database
use workflow-db

# Show collections
show collections

# Query
db.workflows.find()
```

---

## 📞 SUPPORT

### Documentation Files
- `00_START_HERE.md` - Tổng quan
- `SETUP_GUIDE.md` - Chi tiết setup
- `API_EXAMPLES.rest` - API examples
- `ARCHITECTURE.md` - Architecture

### Check Logs First
```bash
docker-compose logs
```

### Verify Connectivity
```bash
# MongoDB
mongosh "your-connection-string"

# Temporal
temporal workflow list

# Backend
curl http://localhost:3001/health
```

---

## ✨ WELL DONE!

Bạn đã setup thành công:
- ✅ MongoDB connection
- ✅ Temporal infrastructure
- ✅ Backend API
- ✅ Worker
- ✅ Monitoring

**Next:** Build React frontend! 🎨

---

**Status:** Ready for Development ✅

**Last Updated:** November 23, 2025

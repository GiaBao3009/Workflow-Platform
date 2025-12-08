# 🚀 RUNNING WORKFLOW PLATFORM - UPDATED GUIDE

## 📋 FIXED ISSUES

✅ Removed `version` from docker-compose.yml (no longer needed)
✅ Commented out Backend and Worker from Docker (run locally instead)
✅ Simplified to core Temporal services first

---

## 🚀 START TEMPORAL SERVICES ONLY

```bash
cd c:\Users\baold\Desktop\my-workflow-platform

# Start core services (PostgreSQL, Elasticsearch, Temporal Server, Temporal UI)
docker-compose up -d
```

**Expected Output:**
```
✅ temporal-postgresql is running
✅ temporal-elasticsearch is running  
✅ temporal-server is running
✅ temporal-ui is running
```

**Verify:**
```bash
docker-compose ps
```

---

## 🚀 START BACKEND API (Locally)

**Terminal 1: Backend API**
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\apps\backend-api

# Install dependencies (first time only)
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

**Expected Output:**
```
✅ Backend API running on port 3001
✅ MongoDB connected
✅ Temporal client ready
```

**Verify:**
```bash
curl http://localhost:3001/health
# Response: {"status":"OK"}
```

---

## 🚀 START TEMPORAL WORKER (Locally)

**Terminal 2: Temporal Worker**
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\hello-temporal

# Install dependencies (first time only)
npm install

# Build TypeScript
npm run build

# Start worker
npm run start:worker
```

**Expected Output:**
```
✅ Temporal Worker started
✅ Connected to temporal:7233
✅ Listening for activities
```

---

## 📊 COMPLETE STARTUP SEQUENCE

### **Window 1: Docker Services** (Run once)
```bash
cd c:\Users\baold\Desktop\my-workflow-platform
docker-compose up -d
```

Wait 30 seconds for services to start...

### **Window 2: Terminal (Backend API)**
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\apps\backend-api
npm install
npm run build
npm start
```

Should show: `✅ Backend API running on port 3001`

### **Window 3: Terminal (Worker)**
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\hello-temporal
npm install
npm run build
npm run start:worker
```

Should show: `✅ Temporal Worker started`

### **Verify All Running**
```bash
# Check Docker services
docker-compose ps

# Check APIs
curl http://localhost:3001/health
curl http://localhost:8080  # Temporal UI

# Check connections
mongosh "your-connection-string"
```

---

## ✅ SERVICES & PORTS

| Service | Port | URL | Status |
|---------|------|-----|--------|
| PostgreSQL | 5432 | - | Docker |
| Elasticsearch | 9200 | - | Docker |
| Temporal Server | 7233 | - | Docker |
| Temporal UI | 8080 | http://localhost:8080 | Docker ✅ |
| Backend API | 3001 | http://localhost:3001 | Local ✅ |
| Worker | - | Connects to 7233 | Local ✅ |

---

## 🧪 TEST EVERYTHING

### Step 1: Check Temporal UI
```
Open: http://localhost:8080
Expected: Dashboard loads
```

### Step 2: Check Backend Health
```bash
curl http://localhost:3001/health
# Expected: {"status":"OK"}
```

### Step 3: Create First Workflow
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'
```

---

## 🔧 PACKAGE.JSON SCRIPTS

### Backend
```bash
cd apps/backend-api

npm install          # Install dependencies
npm run build        # Build TypeScript
npm run dev          # Development mode (watch)
npm start            # Production mode
```

### Worker
```bash
cd hello-temporal

npm install          # Install dependencies
npm run build        # Build TypeScript
npm run start:worker # Start worker
```

---

## 🛑 STOP SERVICES

### Stop Backend
```bash
# Press Ctrl+C in Terminal 1 (Backend)
```

### Stop Worker
```bash
# Press Ctrl+C in Terminal 2 (Worker)
```

### Stop Docker Services
```bash
docker-compose down
```

---

## 🐛 TROUBLESHOOTING

### Backend Won't Start
```
Error: Cannot find module
```

**Solution:**
```bash
cd apps/backend-api
npm install
npm run build
```

### Worker Won't Connect
```
Error: Connection refused to temporal:7233
```

**Solution:**
```bash
# Make sure Docker services are running
docker-compose ps

# If not running:
docker-compose up -d
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr 3001

# Kill it
taskkill /PID [PID_NUMBER] /F
```

### MongoDB Connection Failed
```
Error: Authentication failed
```

**Solution:**
1. Check `.env` file has correct connection string
2. Verify MongoDB Atlas allows your IP
3. Test connection: `mongosh "your-connection-string"`

---

## 📋 ARCHITECTURE NOW

```
┌─────────────────────────────────────────────┐
│ Docker Services (docker-compose up -d)      │
├─────────────────────────────────────────────┤
│ ✅ PostgreSQL (5432)                        │
│ ✅ Elasticsearch (9200)                     │
│ ✅ Temporal Server (7233)                   │
│ ✅ Temporal UI (8080)                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Local Services (Terminal windows)           │
├─────────────────────────────────────────────┤
│ ✅ Backend API (3001) - npm start           │
│ ✅ Worker (listens to 7233) - npm run...    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ External                                    │
├─────────────────────────────────────────────┤
│ ✅ MongoDB Atlas (MongoDB URI in .env)      │
└─────────────────────────────────────────────┘
```

---

## ✨ YOU'RE SET!

**All systems ready:**
✅ Docker services running
✅ Backend API running locally
✅ Worker running locally
✅ MongoDB connected
✅ Temporal coordinating everything

**Next:** Create and execute your first workflow!

---

## 📚 QUICK REFERENCE

### Start Everything
```bash
# Window 1
docker-compose up -d

# Wait 30s, then...

# Window 2
cd apps/backend-api && npm start

# Window 3
cd hello-temporal && npm run start:worker
```

### Stop Everything
```bash
# In each Terminal: Ctrl+C
# Then: docker-compose down
```

### View Logs
```bash
docker-compose logs -f temporal
docker-compose logs -f elasticsearch
```

### Check Status
```bash
docker-compose ps
curl http://localhost:3001/health
curl http://localhost:8080
```

---

**Ready to go! 🚀**

**Status:** ✅ All services running
**Next:** Follow GET_STARTED.md to create workflows

---

Last Updated: November 23, 2025

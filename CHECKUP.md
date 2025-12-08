# ✅ WORKFLOW PLATFORM - SETUP CHECKLIST

## 🎯 Connection String Status

✅ **MongoDB Atlas Connection String:**
```
mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0
```

✅ **Credentials:**
- Username: `admin_workflow`
- Database: `workflow-db`
- Cluster: `cluster0`

✅ **Saved in:** `.env` file

---

## 📋 QUICK CHECKLIST

### ✅ COMPLETED
- [x] MongoDB Atlas account created
- [x] Database cluster setup
- [x] Connection string obtained
- [x] `.env` file created
- [x] All documentation complete
- [x] Backend API ready
- [x] Temporal activities ready
- [x] Docker compose configured

### 🔄 NEXT STEPS

#### Step 1: Verify Prerequisites (5 minutes)
```bash
# Run verification script
test-setup.bat

# OR manually check:
node --version        # v18+
docker --version      # Latest
mongosh --version     # Latest
```

#### Step 2: Start Docker Services (2 minutes)
```bash
docker-compose up -d
```

**Wait for services to start...**

#### Step 3: Verify Services (2 minutes)
```bash
# Check all running
docker-compose ps

# View logs if issues
docker-compose logs
```

#### Step 4: Test Temporal UI (1 minute)
```
Open: http://localhost:8080
Expected: Temporal Dashboard loads
```

#### Step 5: Test Backend Health (1 minute)
```bash
curl http://localhost:3001/health
# Expected: {"status":"OK"}
```

#### Step 6: Test MongoDB (1 minute)
```bash
mongosh "mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db"

# In mongosh:
show dbs
# Expected: See workflow-db
```

---

## 🚀 FIRST WORKFLOW - 5 MINUTES

### Via API (Recommended)

**1. Create User**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

Copy `_id` from response → Save as `USER_ID`

**2. Create Workflow**
```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"USER_ID",
    "name":"My First Workflow",
    "reactFlowData":{
      "nodes":[{
        "id":"node-1",
        "type":"ACTION_HTTP_REQUEST",
        "position":{"x":0,"y":0},
        "data":{"config":{
          "url":"https://jsonplaceholder.typicode.com/posts/1",
          "method":"GET"
        }}
      }],
      "edges":[],
      "viewport":{"x":0,"y":0,"zoom":1}
    },
    "triggerType":"MANUAL"
  }'
```

Copy `_id` from response → Save as `WORKFLOW_ID`

**3. Publish Workflow**
```bash
curl -X POST http://localhost:3001/api/workflows/WORKFLOW_ID/publish
```

**4. Execute Workflow**
```bash
curl -X POST http://localhost:3001/api/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"inputData":{}}'
```

Copy `runId` from response → Save as `RUN_ID`

**5. View Results**
```bash
curl http://localhost:3001/api/workflow-runs/RUN_ID
```

---

## 📊 EXPECTED RESULTS

### After Step 6 (Services Started)
```
✅ All services running:
   - temporal-postgresql: Up
   - temporal-elasticsearch: Up
   - temporal-server: Up
   - temporal-ui: Up
   - backend-api: Up
   - temporal-worker: Up

✅ Temporal UI accessible: http://localhost:8080
✅ Backend responding: curl http://localhost:3001/health → {"status":"OK"}
✅ MongoDB connected: mongosh test successful
```

### After First Workflow
```
✅ User created in MongoDB
✅ Workflow saved with React Flow + Temporal config
✅ Workflow published
✅ Workflow execution started in Temporal
✅ Activity executed (HTTP request)
✅ Results saved in WorkflowRun collection
✅ Visible in Temporal UI
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Error: connect ECONNREFUSED 127.0.0.1:7233"
**Cause:** Temporal server not started

**Solution:**
```bash
docker-compose up -d temporal
docker-compose logs temporal
```

### Issue: "MongoDB: authentication failed"
**Cause:** IP not whitelisted or wrong credentials

**Solution:**
1. MongoDB Atlas → Network Access
2. Add IP: 0.0.0.0/0 (or your IP)
3. Verify credentials in connection string

### Issue: "Backend port 3001 already in use"
**Cause:** Another service using port

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr 3001

# Kill process
taskkill /PID [PID] /F

# Or change port in .env
BACKEND_PORT=3002
```

### Issue: "Cannot find module 'express'"
**Cause:** Dependencies not installed

**Solution:**
```bash
cd apps/backend-api
npm install
cd ../..
```

---

## 📚 IMPORTANT FILES

| File | Purpose | Status |
|------|---------|--------|
| `.env` | Configuration | ✅ Created |
| `docker-compose.yml` | Services | ✅ Updated |
| `GET_STARTED.md` | Quick start | ✅ Created |
| `SETUP_GUIDE.md` | Detailed guide | ✅ Available |
| `API_EXAMPLES.rest` | API tests | ✅ Available |

---

## 🎯 SUCCESS CRITERIA

You know it's working when:

✅ `docker-compose ps` shows 6 services running
✅ `http://localhost:8080` loads Temporal UI
✅ `curl http://localhost:3001/health` returns OK
✅ Can create workflow via API
✅ Can execute workflow
✅ See execution in Temporal UI
✅ Results saved in MongoDB

---

## 📞 QUICK REFERENCE

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f temporal
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Check MongoDB Data
```bash
mongosh "your-connection-string"
use workflow-db
db.workflows.find()
db.workflow_runs.find()
```

---

## 🎉 YOU'RE READY!

**Status:** ✅ Fully Configured

**Next:** 
1. Run `docker-compose up -d`
2. Wait 30 seconds
3. Open http://localhost:8080
4. Follow GET_STARTED.md steps 6

---

**MongoDB Connection String is CONFIRMED ✅**

All systems go! Ready to build your workflow platform! 🚀

---

Last Updated: November 23, 2025

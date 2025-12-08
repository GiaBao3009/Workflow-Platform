# 🎯 QUICK START - 5 MINUTES

## ⚡ TL;DR

```bash
# 1. Setup MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
# 2. Copy connection string to .env
# 3. Run services
docker-compose up -d

# 4. Test
curl http://localhost:3001/health

# 5. View Temporal UI
http://localhost:8080
```

---

## 📋 PREREQUISITE CHECKLIST

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Docker Desktop running (`docker --version`)
- [ ] MongoDB Atlas account created
- [ ] MongoDB connection string obtained

---

## 🚀 3-STEP SETUP

### Step 1: Create `.env` File
```bash
# Create file in project root: .env
MONGODB_URI=mongodb+srv://workflow_user:YOUR_PASSWORD@cluster.mongodb.net/workflow-db
TEMPORAL_ADDRESS=localhost:7233
API_URL=http://localhost:3001
NODE_ENV=development
```

### Step 2: Start Services
```bash
docker-compose up -d
```

### Step 3: Verify
```bash
# Check health
curl http://localhost:3001/health

# Expected response
{"status":"OK"}
```

---

## ✨ WHAT'S RUNNING

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | http://localhost:3001 | REST API |
| **Temporal UI** | http://localhost:8080 | Monitor workflows |
| **PostgreSQL** | localhost:5432 | Temporal DB |
| **MongoDB** | Atlas Cloud | Data storage |

---

## 🧪 TEST FIRST WORKFLOW

### 1. Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

Save the returned `_id`

### 2. Create Workflow
```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "PASTE_USER_ID_HERE",
    "name": "Test Workflow",
    "reactFlowData": {
      "nodes": [
        {
          "id": "node-1",
          "type": "ACTION_HTTP_REQUEST",
          "position": { "x": 0, "y": 0 },
          "data": {
            "config": {
              "url": "https://jsonplaceholder.typicode.com/posts/1",
              "method": "GET",
              "headers": {}
            }
          }
        }
      ],
      "edges": [],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    },
    "triggerType": "MANUAL"
  }'
```

Save the returned workflow `_id`

### 3. Publish Workflow
```bash
curl -X POST http://localhost:3001/api/workflows/PASTE_WORKFLOW_ID_HERE/publish
```

### 4. Execute Workflow
```bash
curl -X POST http://localhost:3001/api/workflows/PASTE_WORKFLOW_ID_HERE/execute
```

Save the returned `runId`

### 5. Check Results
```bash
curl http://localhost:3001/api/workflow-runs/PASTE_RUN_ID_HERE
```

---

## 🎯 WHAT HAPPENS NEXT

```
1. Backend receives execute request
   ↓
2. Temporal Server assigns workflow task
   ↓
3. Worker picks up task
   ↓
4. Worker executes HTTP request activity
   ↓
5. Results saved to MongoDB
   ↓
6. You get results via API
```

**All visible in Temporal UI:** http://localhost:8080

---

## 📚 WANT MORE DETAILS?

- **Setup Help**: Read `SETUP_GUIDE.md`
- **Architecture**: Read `ARCHITECTURE.md`
- **API Examples**: Read `API_EXAMPLES.rest`
- **Full Guide**: Read `INDEX.md`

---

## 🐛 TROUBLESHOOTING

### Services won't start
```bash
# Check Docker
docker ps

# View logs
docker-compose logs

# Restart
docker-compose restart
```

### MongoDB connection fails
```bash
# Verify connection string in .env
# Check whitelist in MongoDB Atlas
# Test: mongosh "your-connection-string"
```

### API returns error
```bash
# Check backend logs
docker-compose logs backend

# Check Temporal UI for workflow details
http://localhost:8080
```

---

## ✅ SUCCESS INDICATORS

You'll know everything works when:

✅ `docker-compose ps` shows all services running
✅ `curl http://localhost:3001/health` returns `{"status":"OK"}`
✅ Can access http://localhost:8080
✅ First workflow executes successfully

---

## 🎉 YOU'RE READY!

Now go build your first real workflow! 

📖 Next: Read `SETUP_GUIDE.md` for detailed information

Happy coding! 🚀

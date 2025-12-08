# 🚀 WORKFLOW PLATFORM - COMPLETE GUIDE INDEX

## 📚 DOCUMENTATION

### Getting Started
1. **README.md** - Project overview & quick start
2. **SETUP_GUIDE.md** - Step-by-step setup instructions
3. **ARCHITECTURE.md** - Detailed architecture & design patterns

### API & Development
4. **API_EXAMPLES.rest** - Complete API request examples
5. **start.bat** - Quick start script (Windows)

### Environment
6. **.env.example** - Environment variables template

---

## 🎯 START HERE (5 Minutes)

### Option A: Quick Start (Automated)
```bash
# Run the quick start script
start.bat
```

### Option B: Manual Setup

**Step 1: Install Prerequisites**
- Node.js 18+ (https://nodejs.org/)
- Docker Desktop (https://www.docker.com/products/docker-desktop)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

**Step 2: Configure MongoDB**
1. Create free cluster on MongoDB Atlas
2. Create database user
3. Get connection string
4. Copy to `.env` file:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/workflow-db
```

**Step 3: Start Services**
```bash
docker-compose up -d
npm install
npm run build
```

**Step 4: Verify Setup**
- Temporal UI: http://localhost:8080
- Backend Health: http://localhost:3001/health

---

## 📋 DEVELOPMENT GUIDE

### Backend API Development

**File:** `apps/backend-api/src/index.ts`

```bash
# Development mode
cd apps/backend-api
npm run dev

# Production build
npm run build
npm start
```

**Key Files:**
- `routes/workflows.ts` - API endpoint definitions
- `package.json` - Dependencies & scripts

### Temporal Worker Development

**File:** `hello-temporal/src/worker.ts`

```bash
# Development mode
cd hello-temporal
npm run dev

# Production
npm run build
npm run start:worker
```

**Key Files:**
- `src/activities.ts` - Activity implementations
- `src/workflows.ts` - Workflow logic
- `src/worker.ts` - Worker initialization

### Frontend Development (Future)

```bash
cd apps/frontend
npm start
```

---

## 🔧 COMMON TASKS

### Creating a New Activity

**File:** `hello-temporal/src/activities.ts`

```typescript
export const myNewActivity = async (
  config: { /* input config */ },
  context: ActivityContext
): Promise<any> => {
  // Your implementation
  return result;
};
```

Then update:
1. `workflows.ts` - Add to activity proxies
2. Node type in frontend
3. API conversion logic

### Adding a New Node Type

1. **Define node type** - In activity nodeType enum
2. **Create activity** - In `activities.ts`
3. **Add conversion logic** - In backend API conversion function
4. **Create UI editor** - In React Flow component (future)

### Monitoring Execution

**Temporal UI:** http://localhost:8080
- Search by workflow ID
- View execution history
- Debug failed activities

**MongoDB:**
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# View workflows
db.workflows.find()

# View runs
db.workflow_runs.find().sort({ createdAt: -1 }).limit(10)
```

---

## 🐛 TROUBLESHOOTING

### Services Won't Start
```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart
```

### MongoDB Connection Failed
```bash
# Verify connection string
mongosh "your-mongodb-uri"

# Check whitelist
# MongoDB Atlas → Network Access → Add IP
```

### Temporal Worker Not Connecting
```bash
# Check Temporal server status
docker-compose logs temporal | grep "accepting"

# Verify port 7233
netstat -an | findstr 7233
```

### Activity Execution Failed
1. Check **Temporal UI** for error details
2. Check **logs** in `docker-compose logs worker`
3. Verify **activity name** matches in config
4. Check **taskQueue** name

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────┐
│  React Frontend │ (Future)
└────────┬────────┘
         │ HTTP
┌────────▼────────────────┐
│   Express Backend       │
│  (REST API Routes)      │
└────────┬────────────────┘
         │ Tasks
┌────────▼────────────────┐
│  Temporal Server        │
│  (Orchestration)        │
└────────┬────────────────┘
         │ Activity Tasks
┌────────▼────────────────┐
│  Temporal Worker        │
│  (Activity Execution)   │
└────────┬────────────────┘
         │ DB Operations
┌────────▼────────────────┐
│  MongoDB Atlas          │
│  (Data Persistence)     │
└────────────────────────┘
```

---

## 💾 DATABASE SCHEMA

### Users
- Manage users/organizations
- Track workflow ownership

### Workflows
- Store workflow design (React Flow)
- Store execution plan (Temporal config)
- Track versions & status

### Workflow Runs
- Execution history
- Activity results
- Error details

---

## 🔐 SECURITY CHECKLIST

- [ ] JWT authentication implemented
- [ ] API endpoints validated for ownership
- [ ] Secrets in environment variables only
- [ ] MongoDB backups enabled
- [ ] CORS configured for trusted origins
- [ ] Activity timeouts set
- [ ] Rate limiting enabled
- [ ] Webhook signing implemented

---

## 🚀 DEPLOYMENT CHECKLIST

### Development → Staging
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] Staging database populated
- [ ] Monitoring enabled

### Staging → Production
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Disaster recovery tested
- [ ] Team trained
- [ ] Rollback plan documented

---

## 📞 USEFUL COMMANDS

### Docker
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service]

# Rebuild images
docker-compose build

# Execute command in container
docker-compose exec [service] [command]
```

### Node/NPM
```bash
# Install dependencies
npm install

# Build
npm run build

# Development
npm run dev

# Production
npm start
```

### MongoDB
```bash
# Connect
mongosh "mongodb+srv://..."

# List databases
show dbs

# Use database
use workflow-db

# List collections
show collections

# Query
db.workflows.find()
db.workflow_runs.find()
```

### Temporal CLI
```bash
# List workflows
temporal workflow list

# Get workflow info
temporal workflow show --workflow-id [id]

# Get workflow history
temporal workflow show --workflow-id [id] --output json
```

---

## 📈 NEXT FEATURES (Roadmap)

### Phase 1: Core Features ✅
- [x] Workflow design (React Flow)
- [x] MongoDB persistence
- [x] Temporal execution
- [x] REST API

### Phase 2: UI/UX
- [ ] React Flow dashboard
- [ ] Node editor panels
- [ ] Workflow templates
- [ ] Search & filtering

### Phase 3: Advanced Execution
- [ ] Conditional branches
- [ ] Loop constructs
- [ ] Error handling
- [ ] Variable mapping UI

### Phase 4: Observability
- [ ] Dashboards
- [ ] Alerts
- [ ] Metrics export
- [ ] Audit logging

### Phase 5: Enterprise
- [ ] Teams/RBAC
- [ ] SSO
- [ ] Advanced scheduling
- [ ] Webhooks

---

## 📖 LEARNING RESOURCES

**Temporal**
- https://docs.temporal.io/
- Concepts: Workflows, Activities, Workers
- SDKs: TypeScript, Python, Go, Java

**React Flow**
- https://reactflow.dev/
- Tutorials & examples
- Component APIs

**MongoDB**
- https://docs.mongodb.com/
- CRUD operations
- Aggregation framework

**Express.js**
- https://expressjs.com/
- Routing guide
- Middleware

**Docker**
- https://docs.docker.com/
- Docker Compose
- Container best practices

---

## 🎯 COMMON WORKFLOWS

### Workflow 1: HTTP to Database
```
[HTTP Request] → [Database Write]
```

### Workflow 2: Data Processing Pipeline
```
[HTTP Read] → [Transform] → [DB Write] → [Email]
```

### Workflow 3: Conditional Logic
```
[HTTP Request] → [If Status OK] → [DB Write]
                  ↓ Else → [Log Error]
```

### Workflow 4: Scheduled Job
```
Trigger: CRON (Daily 2 AM)
Action: [Fetch Data] → [Aggregate] → [Send Report]
```

---

## 💡 PRO TIPS

1. **Use Temporal UI** to monitor all executions
2. **Test activities locally** before deploying
3. **Add comprehensive logging** for debugging
4. **Use MongoDB indexes** on frequently queried fields
5. **Monitor worker logs** for activity failures
6. **Implement retry policies** for external APIs
7. **Version your workflows** for rollback capability
8. **Document activities** with clear config schemas

---

## 🆘 GET HELP

### Check Logs First
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs [service-name]
```

### Verify Setup
```bash
# Health check
curl http://localhost:3001/health

# Temporal connectivity
temporal workflow list

# MongoDB connectivity
mongosh "your-uri"
```

### Common Issues
See **SETUP_GUIDE.md** → Troubleshooting section

---

## ✨ WHAT'S INCLUDED

✅ Complete backend API
✅ Temporal worker setup
✅ MongoDB schema design
✅ Docker configuration
✅ API documentation
✅ Setup guides
✅ Architecture documentation
✅ Example requests

🔜 React frontend (coming next)
🔜 Advanced UI components
🔜 Production deployment guide

---

## 📝 QUICK REFERENCE

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/workflows | Create workflow |
| GET | /api/workflows | List workflows |
| PUT | /api/workflows/{id} | Update workflow |
| POST | /api/workflows/{id}/publish | Publish workflow |
| POST | /api/workflows/{id}/execute | Execute workflow |
| GET | /api/workflows/{id}/runs | List executions |
| GET | /api/workflow-runs/{id} | Get execution detail |
| POST | /webhooks/{id} | Trigger via webhook |

### Database Collections

- `users` - User accounts
- `workflows` - Workflow designs
- `workflow_runs` - Execution history
- `activities_log` - Activity execution logs (future)

---

## 🎓 LEARNING PATH

1. **Day 1:** Read README.md + SETUP_GUIDE.md
2. **Day 2:** Setup environment & verify services
3. **Day 3:** Create first workflow via API
4. **Day 4:** Monitor execution in Temporal UI
5. **Day 5:** Create custom activity
6. **Week 2:** Build React frontend
7. **Week 3:** Deploy to production

---

## 📱 SYSTEM REQUIREMENTS

| Component | Minimum | Recommended |
|-----------|---------|------------|
| RAM | 4GB | 8GB+ |
| CPU | 2 cores | 4+ cores |
| Storage | 2GB | 10GB+ |
| Node.js | 16 | 18+ |
| Docker | 20.10 | Latest |

---

**Happy Building! 🚀**

For detailed information, refer to the specific documentation files.

*Last Updated: January 2024*

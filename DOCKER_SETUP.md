# ⚠️ DOCKER NOT RUNNING - FIX GUIDE

## ❌ ERROR YOU GOT

```
unable to get image 'temporalio/auto-setup:latest': 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**This means:** Docker Desktop is not running

---

## ✅ SOLUTION

### Step 1: Start Docker Desktop

**Option A: GUI**
1. Click Start menu → Search "Docker"
2. Click "Docker Desktop"
3. Wait 1-2 minutes for it to start
4. Look for whale icon in system tray ✓

**Option B: PowerShell (Admin)**
```powershell
# Open PowerShell as Administrator
# Then run:
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"

# Wait 2 minutes for startup...
```

### Step 2: Verify Docker is Running

```bash
docker --version
docker ps
```

**Expected Output:**
```
Docker version 27.x.x...
CONTAINER ID   IMAGE     COMMAND...  (empty list is ok)
```

### Step 3: Start Services Again

```bash
cd c:\Users\baold\Desktop\my-workflow-platform
docker-compose up -d
```

**Expected Output:**
```
✅ Creating temporal-postgresql ... done
✅ Creating temporal-elasticsearch ... done
✅ Creating temporal-server ... done
✅ Creating temporal-ui ... done
```

---

## 🔍 CHECK IF DOCKER IS INSTALLED

```bash
docker --version
```

**If error:** Docker not installed

**Solution:** Download from https://www.docker.com/products/docker-desktop

---

## 📋 FULL STARTUP GUIDE (Step by Step)

### **STEP 1: Start Docker Desktop** (1-2 min)
1. Open Windows Start menu
2. Type: "docker"
3. Click: "Docker Desktop"
4. Wait for whale icon in system tray
5. Check: `docker ps` should work

### **STEP 2: Start Docker Services** (30 sec)
```bash
cd c:\Users\baold\Desktop\my-workflow-platform
docker-compose up -d
docker-compose ps
```

Expected: 4 containers running

### **STEP 3: Wait for Temporal Server** (30 sec)
```bash
# Check logs
docker-compose logs temporal | grep -i "started\|ready"
```

Wait until you see "✓" or "started"

### **STEP 4: Start Backend API** (Terminal 1)
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\apps\backend-api
npm install
npm run build
npm start
```

Wait for: `✅ Backend running on port 3001`

### **STEP 5: Start Worker** (Terminal 2)
```bash
cd c:\Users\baold\Desktop\my-workflow-platform\hello-temporal
npm install
npm run build
npm run start:worker
```

Wait for: `✅ Worker started`

### **STEP 6: Verify All Running** (Terminal 3)
```bash
# Check Docker services
docker-compose ps

# Check APIs
curl http://localhost:3001/health
curl http://localhost:8080

# Open browser
start http://localhost:8080
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Docker Desktop is running (whale icon visible)
- [ ] `docker --version` returns version
- [ ] `docker ps` returns container list
- [ ] `docker-compose ps` shows 4 containers
- [ ] Temporal UI loads at http://localhost:8080
- [ ] Backend health returns OK: `curl http://localhost:3001/health`
- [ ] Worker is connected to Temporal
- [ ] MongoDB connection verified in .env

Once all ✅ → Ready to create workflows!

---

## 🚨 IF DOCKER STILL NOT WORKING

### Issue: "Docker daemon is not running"

**Solution:**
```bash
# Restart Docker
docker-machine restart default

# Or restart WSL (if using WSL2)
wsl --shutdown
wsl --list --verbose  # Check status
```

### Issue: "Docker Desktop not found"

**Solution:**
1. Download: https://www.docker.com/products/docker-desktop
2. Install it
3. Restart computer
4. Run `docker --version`

### Issue: WSL 2 backend issue

**Solution:**
1. Install WSL 2
2. Set Docker Desktop to use WSL 2 backend:
   - Docker Desktop Settings → General → WSL 2 based engine ✓

---

## 💡 QUICK COMMANDS

```bash
# Check Docker running
docker ps

# Check all containers (stopped too)
docker ps -a

# View logs
docker-compose logs

# Stop all
docker-compose down

# Remove all containers
docker system prune -a

# Restart Docker service
docker-machine restart
```

---

## 🎯 ONCE DOCKER IS RUNNING

Follow these steps:

1. Read: `RUN_SERVICES.md` - Detailed startup guide
2. Run: Docker services with `docker-compose up -d`
3. Run: Backend API with `npm start`
4. Run: Worker with `npm run start:worker`
5. Test: Visit http://localhost:8080

---

## 📞 NEED MORE HELP?

### Check Documentation
1. `RUN_SERVICES.md` - Complete service startup
2. `GET_STARTED.md` - Initial setup
3. `CHECKUP.md` - Verification guide

### Common Issues
- Docker not running → Start Docker Desktop
- Port in use → Change port or kill process
- MongoDB error → Check .env file

---

**Status:** Waiting for Docker Desktop to start

**Next Action:** 
1. Start Docker Desktop
2. Wait 2 minutes
3. Run: `docker-compose up -d`
4. Follow `RUN_SERVICES.md`

---

Last Updated: November 23, 2025

@echo off
REM ====================================================
REM   WORKFLOW PLATFORM - QUICK TEST SCRIPT
REM ====================================================

echo.
echo Testing Workflow Platform Setup...
echo.

REM Test 1: Check Docker
echo [1/5] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found
    pause
    exit /b 1
)
echo ✅ Docker found

REM Test 2: Check Node
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    pause
    exit /b 1
)
echo ✅ Node.js found

REM Test 3: Check MongoDB Connection
echo [3/5] Checking MongoDB Connection...
mongosh "mongodb+srv://admin_workflow:baoldz309@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0" --eval "db.adminCommand('ping')" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB connection test failed (may need IP whitelist)
) else (
    echo ✅ MongoDB connection OK
)

REM Test 4: Check Services Status
echo [4/5] Checking Docker Services...
docker-compose ps >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker services not started yet
) else (
    echo ✅ Docker services running
    docker-compose ps
)

REM Test 5: Check Backend Health
echo [5/5] Checking Backend Health...
timeout /t 2 /nobreak
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend not responding (may need to start services)
) else (
    echo ✅ Backend is healthy
)

echo.
echo ====================================================
echo ✅ Setup verification complete!
echo ====================================================
echo.
echo Next steps:
echo   1. Run: docker-compose up -d
echo   2. Check: http://localhost:8080 (Temporal UI)
echo   3. Test: Use API_EXAMPLES.rest
echo.
pause

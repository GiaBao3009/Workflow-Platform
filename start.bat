@echo off
REM ============================================================
REM   QUICK START SCRIPT FOR WORKFLOW PLATFORM
REM ============================================================

echo.
echo ███████╗████████╗ █████╗ ██████╗ ████████╗
echo ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
echo ███████╗   ██║   ███████║██████╔╝   ██║   
echo ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   
echo ███████║   ██║   ██║  ██║██║  ██║   ██║   
echo ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
echo.
echo Workflow Platform Quick Start
echo.

REM Set environment
set MONGODB_URI=mongodb+srv://workflow_user:YourPassword@workflow-db.xxxx.mongodb.net/workflow-db
set TEMPORAL_ADDRESS=localhost:7233
set API_URL=http://localhost:3001
set NODE_ENV=development

echo ✓ Environment variables set
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)
echo ✓ Docker detected

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)
echo ✓ Node.js detected
echo.

REM Start Docker services
echo ┌──────────────────────────────────────────┐
echo │ Starting Docker Compose Services...      │
echo └──────────────────────────────────────────┘
docker-compose up -d

if errorlevel 1 (
    echo ❌ Failed to start Docker services
    pause
    exit /b 1
)

echo ✓ Docker services started
echo.

REM Wait for services
echo Waiting for services to be ready...
timeout /t 5 /nobreak
echo.

REM Install dependencies
echo ┌──────────────────────────────────────────┐
echo │ Installing Dependencies...              │
echo └──────────────────────────────────────────┘

cd apps\backend-api
call npm install
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..\..
echo ✓ Backend dependencies installed

cd hello-temporal
call npm install
if errorlevel 1 (
    echo ❌ Failed to install worker dependencies
    pause
    exit /b 1
)
cd ..\..
echo ✓ Worker dependencies installed
echo.

REM Build services
echo ┌──────────────────────────────────────────┐
echo │ Building Services...                    │
echo └──────────────────────────────────────────┘

cd apps\backend-api
call npm run build
cd ..\..
echo ✓ Backend built

cd hello-temporal
call npm run build
cd ..\..
echo ✓ Worker built
echo.

REM Show status
echo ┌──────────────────────────────────────────┐
echo │ Services Status                          │
echo └──────────────────────────────────────────┘
echo.
docker-compose ps
echo.

REM Show access information
echo ┌──────────────────────────────────────────┐
echo │ 🎉 Setup Complete!                       │
echo └──────────────────────────────────────────┘
echo.
echo Access Information:
echo   - Temporal UI:      http://localhost:8080
echo   - Backend API:      http://localhost:3001
echo   - Frontend:         http://localhost:3000 (manual)
echo.
echo Useful Commands:
echo   - View logs:        docker-compose logs -f
echo   - Stop services:    docker-compose down
echo   - Restart:          docker-compose restart
echo.
echo Next Steps:
echo   1. Update .env file with your MongoDB connection string
echo   2. Open Temporal UI to monitor workflows
echo   3. Start Frontend: cd apps\frontend && npm start
echo.
pause

@echo off
echo ========================================
echo    STARTING ALL SERVICES
echo ========================================
echo.

echo [1/4] Starting Temporal Server...
docker start temporal-server
timeout /t 3 /nobreak >nul

echo [2/4] Starting Backend API...
start "Backend API" cmd /k "cd /d %~dp0apps\backend-api && node dist\index.js"
timeout /t 4 /nobreak >nul

echo [3/4] Starting Worker...
start "Worker" cmd /k "cd /d %~dp0hello-temporal && node dist\worker.js"
timeout /t 2 /nobreak >nul

echo [4/4] Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0apps\frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    ALL SERVICES STARTED!
echo ========================================
echo.
echo Temporal Server: http://localhost:8080
echo Backend API:     http://localhost:3001
echo Frontend:        http://localhost:3000
echo.
echo Press any key to open Frontend in browser...
pause >nul
start http://localhost:3000

@echo off
echo ==================================================================
echo  START ALL SERVICES FOR TELEGRAM + GOOGLE SHEETS WORKFLOW
echo ==================================================================
echo.

echo [1/4] Starting Temporal (Docker)...
docker-compose up -d
timeout /t 3 /nobreak >nul

echo.
echo [2/4] Starting Backend API...
start "Backend API" cmd /k "cd /d %~dp0apps\backend-api && node dist\index.js"
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Starting Worker...
start "Worker" cmd /k "cd /d %~dp0hello-temporal && node dist\worker.js"
timeout /t 2 /nobreak >nul

echo.
echo [4/4] Services started!
echo.
echo ✅ Backend API:   http://localhost:3001
echo ✅ Temporal UI:   http://localhost:8080
echo ✅ Worker:        Running in background
echo.
echo ==================================================================
echo  NEXT STEPS:
echo ==================================================================
echo.
echo 1. Ngrok đã chạy ở terminal khác (URL: https://objectivistic-tuitional-adriane.ngrok-free.dev)
echo.
echo 2. Đợi 10 giây để Backend khởi động xong...
timeout /t 10 /nobreak >nul

echo.
echo 3. Setup webhook tự động...
node quick-setup.js

echo.
echo ==================================================================
pause

@echo off
echo ================================
echo 🔨 Building Backend + Worker
echo ================================

echo.
echo [1/2] Building Backend API...
cd apps\backend-api
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)

echo.
echo [2/2] Building Temporal Worker...
cd ..\..\hello-temporal
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Worker build failed
    pause
    exit /b 1
)

echo.
echo ================================
echo ✅ Build completed successfully!
echo ================================
pause

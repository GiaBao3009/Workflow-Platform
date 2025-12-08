@echo off
echo ================================
echo 🎨 Starting Frontend Development Server
echo ================================
echo.

cd C:\Users\baold\Desktop\my-workflow-platform\apps\frontend

echo Installing dependencies...
call npm install

echo.
echo Starting Vite dev server...
call npm run dev

pause

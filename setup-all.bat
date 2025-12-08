@echo off
cd /d C:\Users\baold\Desktop\my-workflow-platform

echo.
echo ================================
echo 📦 Installing Root Dependencies
echo ================================
call npm install

echo.
echo ================================
echo 📦 Installing Backend Dependencies
echo ================================
cd apps\backend-api
call npm install
cd ..\..

echo.
echo ================================
echo 📦 Installing Worker Dependencies
echo ================================
cd hello-temporal
call npm install
cd ..\..

echo.
echo ================================
echo 🏗️ Building Backend
echo ================================
cd /d C:\Users\baold\Desktop\my-workflow-platform\apps\backend-api
call npm run build

echo.
echo ================================
echo 🏗️ Building Worker
echo ================================
cd /d C:\Users\baold\Desktop\my-workflow-platform\hello-temporal
call npm run build

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. npm start in apps\backend-api (Terminal 1)
echo 2. npm run start:worker in hello-temporal (Terminal 2)
echo.
pause

@echo off
echo Starting ngrok tunnel for backend on port 3001...
echo.
echo After ngrok starts, you will see a Forwarding URL like:
echo   https://xxxx-xxxx-xxxx.ngrok-free.app
echo.
echo Copy that URL and use it to set Telegram webhook:
echo   https://xxxx-xxxx-xxxx.ngrok-free.app/webhooks/whk_3c423f708bf92e9cd46d56100742221d2b8a9bcfcd747b8469fefebc215da21c
echo.
pause
ngrok http 3001

# Quick Setup Script cho Telegram + Google Sheets Workflow

$WORKFLOW_ID = "693ba5dcbb9af2ecdcaa674a"
$NGROK_URL = "https://objectivistic-tuitional-adriane.ngrok-free.dev"
$BACKEND_URL = "http://localhost:3001"
$BOT_TOKEN = "8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " SETUP TELEGRAM + GOOGLE SHEETS WORKFLOW" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend
Write-Host "[1/4] Checking Backend API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   💡 Start backend first: cd apps\backend-api; node dist\index.js" -ForegroundColor Yellow
    exit 1
}

# Step 2: Create webhook
Write-Host ""
Write-Host "[2/4] Creating webhook..." -ForegroundColor Yellow
try {
    $body = @{ description = "Telegram chatbot webhook" } | ConvertTo-Json
    $webhookResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/workflows/$WORKFLOW_ID/webhook" -Method Post -Body $body -ContentType "application/json"
    
    $webhookId = $webhookResponse.webhook.webhookId
    $localWebhookUrl = $webhookResponse.webhook.url
    $publicWebhookUrl = "$NGROK_URL/webhook/$webhookId"
    
    Write-Host "   ✅ Webhook created: $webhookId" -ForegroundColor Green
    Write-Host "   📍 Local:  $localWebhookUrl" -ForegroundColor Cyan
    Write-Host "   📍 Public: $publicWebhookUrl" -ForegroundColor Cyan
    
} catch {
    Write-Host "   ❌ Failed to create webhook: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check if webhook already exists
    Write-Host "   💡 Checking existing webhooks..." -ForegroundColor Yellow
    $webhooks = Invoke-RestMethod -Uri "$BACKEND_URL/api/workflows/$WORKFLOW_ID/webhooks" -Method Get
    
    if ($webhooks.webhooks.Count -gt 0) {
        $webhook = $webhooks.webhooks[0]
        $webhookId = $webhook.webhookId
        $localWebhookUrl = $webhook.url
        $publicWebhookUrl = "$NGROK_URL/webhook/$webhookId"
        
        Write-Host "   ✅ Using existing webhook: $webhookId" -ForegroundColor Green
        Write-Host "   📍 Public: $publicWebhookUrl" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ No webhooks found" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Set Telegram webhook
Write-Host ""
Write-Host "[3/4] Setting Telegram webhook..." -ForegroundColor Yellow
try {
    $telegramBody = @{ url = $publicWebhookUrl } | ConvertTo-Json
    $telegramResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body $telegramBody -ContentType "application/json"
    
    if ($telegramResponse.ok) {
        Write-Host "   ✅ Telegram webhook set successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Telegram webhook failed: $($telegramResponse.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Telegram API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Verify webhook
Write-Host ""
Write-Host "[4/4] Verifying Telegram webhook..." -ForegroundColor Yellow
try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get
    
    Write-Host "   📍 Current webhook: $($webhookInfo.result.url)" -ForegroundColor Cyan
    Write-Host "   ✅ Pending updates: $($webhookInfo.result.pending_update_count)" -ForegroundColor Cyan
    
    if ($webhookInfo.result.last_error_message) {
        Write-Host "   ⚠️  Last error: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to verify: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 GOOGLE SHEETS:" -ForegroundColor Yellow
Write-Host "   Spreadsheet ID: 1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ"
Write-Host "   Sheet: Sheet1"
Write-Host ""
Write-Host "⚠️  QUAN TRỌNG: Share sheet với Service Account" -ForegroundColor Red
Write-Host "   Email: workflow-sheets-313@my-workflow-platform-480113.iam.gserviceaccount.com"
Write-Host "   Quyền: Editor"
Write-Host ""
Write-Host "🧪 TEST NGAY:" -ForegroundColor Yellow
Write-Host "   1. Mở Telegram chat với bot của bạn"
Write-Host "   2. Gửi: 'Xin chào' → Bot sẽ trả lời"
Write-Host "   3. Gửi: 'Tôi đánh giá 9 điểm' → Lưu vào Sheet"
Write-Host ""
Write-Host "⚙️  SERVICES CẦN CHẠY:" -ForegroundColor Yellow
Write-Host "   ✅ Backend: node apps/backend-api/dist/index.js"
Write-Host "   ⚠️  Worker: node hello-temporal/dist/worker.js (CẦN START!)"
Write-Host "   ✅ ngrok: ngrok http 3001"
Write-Host "   ✅ Temporal: docker-compose up -d"
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan

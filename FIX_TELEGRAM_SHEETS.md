# 🚀 FIX TELEGRAM + GOOGLE SHEETS WORKFLOW

## ❌ VẤN ĐỀ PHÁT HIỆN

Workflow "node chat tele đánh giá sheets" (ID: 693ba5dcbb9af2ecdcaa674a) không hoạt động vì:

1. ✅ **FIXED** - TriggerType sai: Đã đổi từ `MANUAL` → `WEBHOOK`
2. ⚠️ **CẦN FIX** - Chưa tạo webhook
3. ⚠️ **CẦN FIX** - Chưa set Telegram webhook URL
4. ⚠️ **CẦN FIX** - Chưa share Google Sheet với Service Account

---

## ✅ CÁC BƯỚC FIX (5 PHÚT)

### Bước 1: Start All Services

```bash
# Terminal 1: Start Temporal (nếu chưa chạy)
docker-compose up -d

# Terminal 2: Start Backend
cd apps\backend-api
node dist\index.js

# Terminal 3: Start Worker  
cd hello-temporal
node dist\worker.js

# Terminal 4: Start ngrok (để expose localhost)
ngrok http 3001
# Hoặc: npm run ngrok (nếu đã thêm vào package.json)
# Hoặc: start-ngrok.bat
# Copy Forwarding URL (vd: https://abc123.ngrok-free.dev)
```

### Bước 2: Tạo Webhook và Set Telegram

```bash
# Chạy script tự động
node setup-telegram-sheets-complete.js

# Script sẽ hỏi ngrok URL của bạn
# Paste URL từ Terminal 4 (vd: https://abc123.ngrok.io)
```

### Bước 3: Share Google Sheet

1. Mở sheet: https://docs.google.com/spreadsheets/d/1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ/edit
2. Click **Share** (góc trên bên phải)
3. Add email:
   ```
   workflow-sheets-313@my-workflow-platform-480113.iam.gserviceaccount.com
   ```
4. Chọn quyền: **Editor**
5. Click **Send**

### Bước 4: Test Workflow

1. Mở Telegram, chat với bot của bạn
2. Gửi tin nhắn: `Xin chào`
3. Bot sẽ trả lời (qua Gemini AI)
4. Gửi feedback: `Tôi đánh giá 9 điểm` hoặc `Rất tốt`
5. Kiểm tra Google Sheet → Dữ liệu đã được lưu

---

## 🔍 DEBUG

### Check Backend Logs
```bash
# Xem log khi có webhook request
# Nếu có lỗi, sẽ hiện ở đây
```

### Check Worker Logs
```bash
# Xem log khi workflow execute
# Activities: Gemini, Google Sheets, Telegram
```

### Check Temporal UI
```
http://localhost:8080
# Xem workflow execution history
```

### Verify Telegram Webhook
```bash
curl https://api.telegram.org/bot8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks/getWebhookInfo
```

---

## 📊 GOOGLE SHEETS CONFIG

Workflow hiện tại:
- **Spreadsheet ID**: `1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ`
- **Sheet Name**: `Sheet1`
- **Action**: `APPEND`
- **Range**: `A:F`
- **Columns**: Timestamp, Username, Chat ID, Message, AI Response, Score

Service Account đã được cấu hình trong `.env`:
```
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

---

## 🎯 WORKFLOW LOGIC

```
1. User gửi tin nhắn qua Telegram
   ↓
2. Webhook nhận request → Backend API
   ↓
3. Backend trigger Temporal workflow
   ↓
4. Activity 1: Gemini AI phân tích tin nhắn
   - Nếu là feedback → trả về JSON với is_feedback: true
   - Nếu là câu hỏi → trả về JSON với response
   ↓
5. Content Filter kiểm tra is_feedback
   ↓
6a. NẾU là feedback:
    → Activity 2: Google Sheets APPEND data
    → Activity 3: Content Filter kiểm tra sentiment
    → Activity 4: Telegram reply "Đã lưu phản hồi"
   ↓
6b. NẾU KHÔNG phải feedback:
    → Activity 5: Telegram reply với AI response
```

---

## ⚠️ COMMON ISSUES

### Issue 1: Backend không kết nối Temporal
**Triệu chứng**: `Temporal Server không khả dụng`
**Fix**: 
```bash
docker ps  # Check temporal-server đang chạy
docker logs temporal-server  # Xem log
```

### Issue 2: Google Sheets API lỗi 403
**Triệu chứng**: `The caller does not have permission`
**Fix**: Share sheet với Service Account email (Bước 3)

### Issue 3: Telegram không nhận webhook
**Triệu chứng**: Bot không trả lời
**Fix**: 
- Check ngrok đang chạy
- Verify webhook URL có HTTPS
- Test webhook: `curl -X POST https://your-ngrok-url/webhooks/whk_...`

### Issue 4: Gemini API quota
**Triệu chứng**: `429 Resource Exhausted`
**Fix**: Wait 1 minute hoặc dùng API key khác

---

## 📝 MANUAL FIX (Nếu script không chạy)

### Create Webhook Manually
```bash
curl -X POST http://localhost:3001/api/workflows/693ba5dcbb9af2ecdcaa674a/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name": "Telegram Webhook", "description": "Telegram webhook"}'

# Save webhook ID from response
```

### Set Telegram Webhook Manually
```bash
curl -X POST "https://api.telegram.org/bot8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL/webhook/YOUR_WEBHOOK_ID"}'
```

---

## ✅ CHECKLIST

- [ ] Docker Temporal services running
- [ ] Backend API running (port 3001)
- [ ] Worker running
- [ ] ngrok running (có HTTPS URL)
- [ ] Webhook created
- [ ] Telegram webhook set
- [ ] Google Sheet shared với Service Account
- [ ] Test tin nhắn thành công
- [ ] Test feedback lưu vào sheet

---

## 📞 SUPPORT

Nếu vẫn không hoạt động:
1. Check tất cả services đang chạy
2. Xem logs của Backend + Worker
3. Test từng bước một
4. Verify credentials trong `.env`

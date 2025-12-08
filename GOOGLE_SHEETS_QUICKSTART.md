# ⚡ Google Sheets - Quick Start (3 phút)

## 🚨 Bị lỗi "Organization Policy blocks service account key creation"?

**GIẢI PHÁP:** Dùng API Key thay vì Service Account Key!

---

## 📋 Checklist (Làm theo thứ tự)

### ☑️ **1. Tạo Google Cloud Project** (1 phút)
```
https://console.cloud.google.com
→ New Project
→ Tên: "My Workflow Platform"
→ Create
```

### ☑️ **2. Enable Google Sheets API** (30 giây)
```
APIs & Services > Library
→ Tìm "Google Sheets API"
→ Click Enable
```

### ☑️ **3. Tạo API Key** (1 phút)
```
APIs & Services > Credentials
→ Create Credentials > API Key
→ Copy key: AIzaSyD...
→ Click vào key vừa tạo
→ API restrictions > Restrict key
→ Tick ✅ Google Sheets API
→ Save
```

### ☑️ **4. Thêm vào .env** (10 giây)
Mở file `.env` trong project, thêm dòng:
```env
GOOGLE_API_KEY=AIzaSyD-paste-key-ở-đây
```

### ☑️ **5. Tạo Test Spreadsheet** (30 giây)
```
1. Vào Google Sheets: https://sheets.google.com
2. Tạo sheet mới
3. Đặt tên: "Workflow Test"
4. Thêm header row:
   A1: Timestamp
   B1: User
   C1: Message
```

### ☑️ **6. Share Spreadsheet** (10 giây)
```
Click "Share"
→ General access: "Anyone with the link"
→ Role: "Editor"
→ Copy link
```

### ☑️ **7. Lấy Spreadsheet ID** (5 giây)
Từ link: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdD.../edit`

Copy phần giữa: `1BxiMVs0XRA5nFMdKvBdD...`

---

## 🧪 Test Workflow

### **Workflow 1: Log Telegram Messages vào Sheets**

**Tạo workflow:**
```
1. Drag "📨 Webhook" lên canvas
2. Drag "📊 Google Sheets" lên canvas  
3. Kết nối: Webhook → Google Sheets
```

**Config Google Sheets Node:**
- **Spreadsheet ID**: `1BxiMVs0XRA5nFMdKvBdD...` (paste ID từ bước 7)
- **Action**: `APPEND`
- **Sheet Name**: `Sheet1`
- **Range**: `A:C`
- **Values**: Click 📦 → Chọn variables:
  ```json
  [
    ["{{workflow.timestamp}}", "{{webhook.message.from.username}}", "{{webhook.message.text}}"]
  ]
  ```

**Save workflow → Deploy**

**Test:**
1. Gửi tin nhắn bất kỳ vào Telegram bot
2. Mở Google Sheets
3. Check row mới xuất hiện! ✅

---

## 🎉 Xong rồi!

**Workflow của bạn giờ có thể:**
- ✅ Đọc data từ Google Sheets
- ✅ Ghi data vào Google Sheets  
- ✅ Log conversation history
- ✅ Tạo analytics dashboard

---

## 💡 Tips

### **READ Operation**
```javascript
Config:
  Action: READ
  Range: "A2:C10" // Đọc từ A2 đến C10
  
// Use data trong workflow:
{{sheets-1.values}} // Array 2D
{{sheets-1.values[0][0]}} // Cell đầu tiên
```

### **APPEND vs WRITE**
```javascript
APPEND: Thêm vào cuối (cho logging)
WRITE: Ghi đè (cho update data)
```

### **Multiple Sheets**
```javascript
Sheet Name: "Sheet1" // Tab đầu
Sheet Name: "Logs"   // Tab tên "Logs"
Sheet Name: "Data"   // Tab tên "Data"
```

---

## ❓ FAQ

**Q: API Key có giới hạn gì không?**
A: Free tier: 300 requests/minute, 60,000 requests/day (đủ xài)

**Q: Có an toàn không?**
A: API Key chỉ access được sheets mà bạn share. Restrict key chỉ cho Google Sheets API.

**Q: Cần Service Account không?**
A: KHÔNG! API Key đủ cho 99% use case.

**Q: Spreadsheet phải public không?**
A: Không. "Anyone with the link" là đủ (không index trên Google).

---

**🚀 Giờ sang node tiếp theo: Text-to-Speech!**

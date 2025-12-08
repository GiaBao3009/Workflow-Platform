# 📊 Google Sheets Integration Setup Guide

## ⚡ Quick Start (5 phút)

**TÓM TẮT:** Organization của bạn chặn Service Account Key creation? → Dùng API Key!

### **Bước 1: Tạo Google Cloud Project**
1. https://console.cloud.google.com → **New Project**
2. Tên: `My Workflow Platform` → **Create**

### **Bước 2: Enable Google Sheets API**
1. **APIs & Services > Library**
2. Tìm: `Google Sheets API` → **Enable**

### **Bước 3: Tạo API Key** ✅ RECOMMENDED
1. **APIs & Services > Credentials**
2. **Create Credentials > API Key**
3. Copy API Key: `AIzaSyD...`
4. **Restrict Key**:
   - API restrictions → ✅ Google Sheets API
   - **Save**

### **Bước 4: Add vào .env**
```env
GOOGLE_API_KEY=AIzaSyD-paste-key-của-bạn-ở-đây
```

### **Bước 5: Share Spreadsheet**
1. Mở Google Sheets bạn muốn dùng
2. **Share > Anyone with the link > Editor**
3. Copy link để lấy Spreadsheet ID

**✅ DONE! Giờ test thử workflow.**

---

## 🎯 Overview
Google Sheets node cho phép bạn:
- **READ**: Đọc dữ liệu từ spreadsheet
- **WRITE**: Ghi đè dữ liệu
- **APPEND**: Thêm dòng mới
- **CLEAR**: Xóa dữ liệu

---

## 🔑 Setup Google Service Account (5 phút)

### **Step 1: Create Google Cloud Project**
1. Truy cập: https://console.cloud.google.com
2. Click **"New Project"**
3. Tên project: `My Workflow Platform`
4. Click **"Create"**

### **Step 2: Enable Google Sheets API**
1. Trong project mới tạo, vào **APIs & Services > Library**
2. Tìm kiếm: `Google Sheets API`
3. Click **"Enable"**

### **Step 3: Create Service Account**
1. Vào **APIs & Services > Credentials**
2. Click **"Create Credentials" > "Service Account"**
3. Điền thông tin:
   - Service account name: `workflow-sheets`
   - Service account ID: `workflow-sheets@...`
   - Click **"Create and Continue"**
4. Role: Chọn **"Editor"** hoặc **"Viewer"** (tùy nhu cầu)
5. Click **"Continue"** → **"Done"**

### **Step 4A: Tạo API Key (Phương pháp đơn giản - Recommended)**

**⚠️ NẾU BỊ LỖI:** "Organization Policy blocks service account key creation"
→ Dùng phương pháp này thay vì Service Account Key!

1. Vào **APIs & Services > Credentials**
2. Click **"Create Credentials" > "API Key"**
3. Copy API key vừa tạo (dạng: `AIzaSyD...`)
4. **Restrict Key** (Recommended):
   - Click vào API key vừa tạo
   - **Application restrictions**: None (hoặc IP addresses nếu có fixed IP)
   - **API restrictions**: Chọn "Restrict key"
   - Tick ✅ **Google Sheets API**
   - Click **"Save"**

### **Step 4B: Tạo Service Account Key (Alternative - Nếu có quyền)**

**⚠️ Chỉ dùng nếu organization cho phép:**

1. Click vào service account vừa tạo
2. Tab **"Keys"** → **"Add Key"** → **"Create new key"**
3. Chọn **JSON** format
4. Click **"Create"**
5. File JSON sẽ được download tự động

**NẾU BỊ LỖI:** Dùng Step 4A (API Key) thay thế!

---

### **Step 5: Add to .env**

**Option 1: Dùng API Key (Đơn giản hơn)**
```env
GOOGLE_API_KEY=AIzaSyD-1234567890abcdefghijklmnopqrstuvwxyz
```

**Option 2: Dùng Service Account JSON**
```env
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**⚠️ LƯU Ý:**
- API Key: Copy trực tiếp, không cần quotes
- Service Account JSON: Phải wrap trong single quotes `'...'`

---

## 📝 Setup Spreadsheet Permissions

### **Với API Key:**
1. Mở Google Sheets bạn muốn dùng
2. Click **"Share" > "Anyone with the link"**
3. Chọn quyền: **Viewer** (cho READ) hoặc **Editor** (cho WRITE/APPEND)
4. Copy link để lấy Spreadsheet ID

### **Với Service Account:**
1. Mở Google Sheets bạn muốn dùng
2. Click **"Share"**
3. Add email của service account:
   - Email: `workflow-sheets@my-workflow-platform.iam.gserviceaccount.com`
   - (Lấy từ file JSON → `client_email`)
4. Chọn quyền: **Editor** hoặc **Viewer**
5. Click **"Send"**

---

## 🧪 Test Google Sheets Node

### **Workflow Example 1: Log Messages to Sheet**

```
[Webhook Telegram] → Nhận message
  ↓
[Google Sheets APPEND]
  Config:
  - Spreadsheet ID: "1BxiMVs0XRA5nFMdKvBdD..."
  - Action: APPEND
  - Sheet Name: "Messages"
  - Range: "A:C"
  - Values: [
      ["{{workflow.timestamp}}", "{{webhook.message.from.username}}", "{{webhook.message.text}}"]
    ]
  ↓
[Telegram] → "✅ Đã lưu tin nhắn vào Google Sheets"
```

### **Workflow Example 2: Read Data & Send**

```
[Schedule: Daily 9 AM]
  ↓
[Google Sheets READ]
  Config:
  - Spreadsheet ID: "..."
  - Action: READ
  - Sheet Name: "Daily Tasks"
  - Range: "A2:C10"
  ↓
[Gemini] → Tóm tắt tasks
  Prompt: "Tóm tắt danh sách công việc: {{sheets-1.values}}"
  ↓
[Telegram] → Gửi summary
```

---

## 📚 Config Reference

### **spreadsheetId**
- Lấy từ URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- Example: `1BxiMVs0XRA5nFMdKvBdD4dIjWbC1TqMFcXJY9-zK8s`

### **action**
- `READ`: Đọc data
- `WRITE`: Ghi đè (replace existing)
- `APPEND`: Thêm vào cuối
- `CLEAR`: Xóa data

### **sheetName**
- Tên tab trong spreadsheet
- Default: Sheet đầu tiên
- Example: `"Sheet1"`, `"Data"`, `"Logs"`

### **range (A1 notation)**
- `A1:B10` - Range cụ thể
- `A:C` - Toàn bộ cột A đến C
- `2:5` - Dòng 2 đến 5
- `A1:Z` - Từ A1 đến cuối cột Z

### **values (2D Array)**
```javascript
// Single row
[["John", "john@example.com", "25"]]

// Multiple rows
[
  ["Name", "Email", "Age"],
  ["John", "john@example.com", "25"],
  ["Mary", "mary@example.com", "30"]
]

// With variables
[
  ["{{workflow.timestamp}}", "{{user.name}}", "{{gemini-1.response}}"]
]
```

---

## 🔧 Troubleshooting

### **Error: "Organization Policy blocks service account key creation"**
**Nguyên nhân:** Organization của bạn enforce policy `iam.disableServiceAccountKeyCreation`

**Giải pháp:** ✅ **Dùng API Key thay vì Service Account Key**
1. Quay lại Step 4A (Tạo API Key)
2. Thêm vào `.env`: `GOOGLE_API_KEY=AIzaSy...`
3. Share spreadsheet: "Anyone with the link" → Editor/Viewer

**Ưu điểm API Key:**
- Không cần Service Account Key (bypass organization policy)
- Setup đơn giản hơn
- Đủ cho hầu hết use case

**Nhược điểm API Key:**
- Cần share spreadsheet publicly (hoặc anyone with link)
- Không có email riêng như Service Account

---

### **Error: "The caller does not have permission"**
**Nguyên nhân:** Service account chưa được share spreadsheet

**Giải pháp:**
1. Mở spreadsheet
2. Share với email service account
3. Chọn quyền Editor

### **Error: "Requested entity was not found"**
**Nguyên nhân:** Sai spreadsheet ID hoặc sheet name

**Giải pháp:**
1. Check spreadsheet ID trong URL
2. Check sheet name (case-sensitive)

### **Error: "Invalid credentials"**
**Nguyên nhân:** GOOGLE_SERVICE_ACCOUNT_JSON sai format

**Giải pháp:**
1. Copy lại toàn bộ file JSON
2. Wrap trong single quotes
3. Không thêm/bớt ký tự nào

---

## 💡 Best Practices

### **1. Structured Data**
```javascript
// ✅ Good: Header row + consistent columns
[
  ["Timestamp", "User", "Message", "Sentiment"],
  ["2025-12-03 10:00", "John", "Hello", "Positive"]
]

// ❌ Bad: Inconsistent columns
[
  ["John", "Hello"],
  ["Mary", "Hi", "Extra column?"]
]
```

### **2. Use APPEND for Logs**
```javascript
// Logging workflow runs
Action: APPEND
Values: [[
  "{{workflow.timestamp}}",
  "{{workflow.id}}",
  "{{workflow.status}}",
  "{{gemini-1.tokens}}"
]]
```

### **3. Use READ for Lookups**
```javascript
// Read config từ sheet
Action: READ
Range: "Config!A2:B10"
// Use trong workflow
If {{sheets-1.values[0][0]}} == "enabled"
```

### **4. Data Validation**
```javascript
// Validate trước khi write
[Conditional] → Check data format
  ↓ (PASS)
[Google Sheets APPEND]
  ↓ (FAIL)
[Telegram] → "❌ Invalid data format"
```

---

## 📊 Example Use Cases

### **1. Customer Survey Logger**
User điền survey qua Telegram → Log vào Google Sheets → Auto-analyze với Gemini

### **2. Price Tracker**
Web Scraper lấy giá → Lưu vào Sheets → Track trends → Alert khi giảm giá

### **3. Task Manager**
Read tasks từ Sheets → Send daily reminders → Update status khi complete

### **4. Analytics Dashboard**
Log mọi workflow execution → Sheets làm database → Google Data Studio visualize

---

## 🎓 Advanced Tips

### **Batch Operations**
```javascript
// APPEND multiple rows at once
Values: [
  ["Row 1 Col A", "Row 1 Col B"],
  ["Row 2 Col A", "Row 2 Col B"],
  ["Row 3 Col A", "Row 3 Col B"]
]
```

### **Formula Support**
```javascript
// Write formula
Values: [["=SUM(A1:A10)", "=AVERAGE(B1:B10)"]]
```

### **Named Ranges**
```javascript
// Use named range instead of A1 notation
Range: "SalesData" // Must define in Google Sheets first
```

---

**🎉 Setup Complete!**
Google Sheets node giờ đã sẵn sàng sử dụng trong workflow của bạn!

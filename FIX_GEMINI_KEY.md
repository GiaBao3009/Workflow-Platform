# 🔑 FIX GEMINI API KEY

## ❌ VẤN ĐỀ

```
Error: Gemini call failed: API key expired. Please renew the API key.
```

## ✅ GIẢI PHÁP (2 PHÚT)

### Bước 1: Tạo Gemini API Key Mới

1. Mở: **https://aistudio.google.com/app/apikey**
2. Click **"Create API Key"**
3. Chọn project hoặc "Create API key in new project"
4. Copy API key mới (dạng: `AIzaSy...`)

### Bước 2: Update .env Files

**File 1**: `c:\Users\baold\Desktop\my-workflow-platform\.env`
```env
# Thay dòng cũ:
GEMINI_API_KEY=AIzaSyAv7aiPOHZyZMxf9t6TFQdnyld4HWWMLdQ

# Bằng key mới:
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
```

**File 2**: `c:\Users\baold\Desktop\my-workflow-platform\hello-temporal\.env`
```env
# Thay dòng cũ:
GEMINI_API_KEY=AIzaSyCaXdqmDKzAxmUVa35E0b_1hgDJeZ-KdcI

# Bằng key mới:
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
```

### Bước 3: Restart Worker

```bash
# Tắt worker hiện tại (Ctrl+C trong terminal worker)
# Sau đó chạy lại:
cd hello-temporal
node dist\worker.js
```

### Bước 4: Test Lại

Gửi tin nhắn qua Telegram bot → Sẽ hoạt động!

---

## 🚀 SCRIPT TỰ ĐỘNG UPDATE KEY

Chạy script này sau khi có key mới:

```bash
node update-gemini-key.js YOUR_NEW_KEY_HERE
```

Script sẽ tự động update cả 2 files .env và nhắc bạn restart worker.

---

## 📝 LƯU Ý

- Key Gemini free có giới hạn: 60 requests/minute
- Nếu vượt quota: Đợi 1 phút hoặc tạo project mới
- Key không expire nếu project còn active
- Có thể tạo nhiều keys cho backup

---

## 🔍 VERIFY KEY MỚI

Test key ngay sau khi update:

```bash
node test-gemini-key.js
```

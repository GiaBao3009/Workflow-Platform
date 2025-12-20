# 🔧 GIẢI PHÁP CHO GEMINI API ISSUES

## ⚠️ VẤN ĐỀ

Gemini API keys liên tục bị lỗi/expired ngay sau khi tạo.

## 🎯 NGUYÊN NHÂN THƯỜNG GẶP

1. **Gemini Free Tier Limits**:
   - 60 requests/minute
   - 1,500 requests/day
   - Có thể bị rate limit ngay lập tức nếu spam requests

2. **Model Name Cũ**:
   - `gemini-pro` đã deprecated
   - Cần dùng `gemini-2.5-flash` hoặc `gemini-2.5-pro`

3. **API Not Enabled**:
   - Cần enable "Generative Language API" trên Google Cloud Console

4. **Region Restrictions**:
   - Một số region không support Gemini API

---

## ✅ GIẢI PHÁP 1: FIX MODEL NAME (KHUYẾN NGHỊ)

Workflow của bạn đang dùng model cũ. Hãy update:

```bash
# Chạy script tự động fix
node fix-gemini-model-name.js
```

Script sẽ:
- Đổi `gemini-pro` → `gemini-2.5-flash`
- Restart worker tự động
- Test lại

---

## ✅ GIẢI PHÁP 2: ENABLE API ĐÚNG CÁCH

### Bước 1: Google AI Studio (FREE)

1. Mở: https://aistudio.google.com/
2. Đăng nhập Google account
3. Click **"Get API key"** ở sidebar
4. Click **"Create API key"**
5. Chọn **"Create API key in new project"**
6. Copy key

### Bước 2: Test Ngay

```bash
node test-new-gemini-key.js YOUR_NEW_KEY
```

Nếu **VẪN LỖI** → Thử Giải pháp 3

---

## ✅ GIẢI PHÁP 3: DÙNG OPENAI THAY THẾ

Bạn đã có OpenAI API key trong .env! Hãy chuyển sang dùng OpenAI:

```bash
# Đổi workflow sang dùng OpenAI
node switch-to-openai.js
```

**Ưu điểm**:
- ✅ Stable hơn Gemini
- ✅ Ít lỗi rate limit
- ✅ API key của bạn đã có sẵn

**Nhược điểm**:
- ⚠️ Tốn tiền (nhưng rất rẻ cho testing)
- Free tier: $5 credit cho tài khoản mới

---

## ✅ GIẢI PHÁP 4: SKIP GEMINI - TEST GOOGLE SHEETS TRƯỚC

Tạm thời disable Gemini để test phần Google Sheets + Telegram:

```bash
node create-simple-test-workflow.js
```

Workflow mới này sẽ:
1. Nhận tin nhắn Telegram
2. **Bỏ qua Gemini** - trả về response cố định
3. Lưu trực tiếp vào Google Sheets
4. Reply Telegram

→ Giúp verify Google Sheets integration hoạt động!

---

## ✅ GIẢI PHÁP 5: GEMINI VỚI RETRY LOGIC

Nếu muốn cố gắng với Gemini, dùng key với retry:

```bash
# Test với retry và exponential backoff
node test-gemini-with-retry.js YOUR_NEW_KEY
```

---

## 🆘 TROUBLESHOOTING CHECKLIST

- [ ] Thử model mới: `gemini-2.5-flash`
- [ ] Test key ngay sau khi tạo: `node test-new-gemini-key.js KEY`
- [ ] Check quota: https://aistudio.google.com/app/apikey
- [ ] Thử tạo key từ project khác
- [ ] Đợi 1-2 phút sau khi tạo key mới
- [ ] Clear cache: Restart worker sau khi update key
- [ ] Fallback: Chuyển sang OpenAI

---

## 💡 KHUYẾN NGHỊ

**Để project hoạt động NGAY:**

1. **Option A - Nhanh**: Dùng OpenAI (đã có key)
   ```bash
   node switch-to-openai.js
   ```

2. **Option B - Test Sheets**: Skip AI, test Google Sheets trước
   ```bash
   node create-simple-test-workflow.js
   ```

3. **Option C - Fix Gemini**: Update model name + key mới
   ```bash
   node fix-gemini-model-name.js
   node update-gemini-key.js YOUR_NEW_KEY
   ```

---

Bạn muốn thử giải pháp nào? Tôi khuyến nghị **Option A (OpenAI)** để project chạy ngay! 🚀

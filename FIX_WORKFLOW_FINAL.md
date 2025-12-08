# 🔧 HƯỚNG DẪN SỬA LỖI WORKFLOW - FINAL FIX

## ❌ VẤN ĐỀ HIỆN TẠI

Bot đang gửi **CẢ 2 TIN NHẮN** cho câu hỏi thường:
1. ✅ Tin nhắn Gemini (đúng)
2. ❌ Tin nhắn "✅ Cảm ơn đánh giá..." + `{{sheets-1.updatedRange}}` (SAI!)

**Nguyên nhân**:
- Filter #1 đang check **SAI INPUT**: Check string JSON thô thay vì biến đã parse
- Keyword tìm kiếm sai format: `is_feedback\": true` (thiếu dấu ngoặc kép đầu)

---

## ✅ GIẢI PHÁP - 5 BƯỚC ĐỂ SỬA

### **Bước 1: Mở Workflow trong UI**
1. Truy cập: `http://localhost:5173`
2. Click vào workflow có Telegram bot
3. Chế độ Edit sẽ hiện canvas với 7 nodes

---

### **Bước 2: Sửa Filter #1 - Input Text**

**Tìm node**: "Lọc Nội Dung #1" (node thứ 3 từ trái)

1. **Click vào node** "Lọc Nội Dung #1"
2. Panel config hiện bên phải
3. Tìm field **"Nội dung cần kiểm tra"**

**❌ GIÁ TRỊ HIỆN TẠI (SAI)**:
```
{{gemini-1.rawResponse}}
```
hoặc
```
```json
{
  "is_feedback": false,
  "response": "..."
}
```
```

**✅ GIÁ TRỊ MỚI (ĐÚNG)**:
```
{{gemini-1.isFeedback}}
```

**Cách nhập**:
- **CÁCH 1 (Gõ tay)**: Xóa hết → Gõ: `{{gemini-1.isFeedback}}`
- **CÁCH 2 (Click chọn)**: 
  1. Click icon 📦 bên cạnh field
  2. Chọn node `gemini-1` trong dropdown
  3. Chọn variable `isFeedback`
  4. Click "Chọn"

---

### **Bước 3: Sửa Filter #1 - Keywords**

Ở **CÙNG PANEL** (Filter #1):

1. Tìm field **"Từ khóa nhạy cảm"** (textarea)

**❌ GIÁ TRỊ HIỆN TẠI (SAI)**:
```
is_feedback": true
```
hoặc
```
"is_feedback": true
```

**✅ GIÁ TRỊ MỚI (ĐÚNG)** - CHỈ 1 DÒNG:
```
true
```

**Lưu ý**: 
- Chỉ ghi chữ `true` (không có dấu ngoặc kép, không có dấu hai chấm)
- Vì bây giờ đang check biến `isFeedback` (boolean), không phải JSON string

---

### **Bước 4: Lưu Filter #1**

1. Scroll xuống cuối panel
2. Click nút **"💾 Lưu cấu hình"**
3. Chờ thông báo "✅ Đã lưu"

---

### **Bước 5: Kiểm tra Filter #2 (Optional)**

**Tìm node**: "Lọc Nội Dung #2" (node thứ 5)

1. Click vào node "Lọc Nội Dung #2"
2. Kiểm tra config:

**✅ NỘI DUNG CẦN KIỂM TRA** (phải là):
```
{{gemini-1.rawResponse}}
```

**✅ TỪ KHÓA** (phải là):
```
"sentiment": "negative"
```

**Nếu ĐÚNG** → Không cần sửa, click "Đóng"
**Nếu SAI** → Sửa lại như trên → Click "💾 Lưu cấu hình"

---

## 🔄 SAU KHI SỬA XONG

### **1. Deploy Workflow**
1. Click nút **"🚀 Deploy"** ở góc trên cùng canvas
2. Chờ thông báo "✅ Workflow deployed successfully"

### **2. Restart Worker** (Quan trọng!)
Mở Terminal PowerShell:
```powershell
cd C:\Users\baold\Desktop\my-workflow-platform

# Kill process cũ
taskkill /F /IM node.exe

# Start lại worker
cd hello-temporal
npm run dev
```

### **3. Test Workflow**

#### **Test 1: Câu hỏi thường** (không phải feedback)
Gửi Telegram: `hello`

**✅ KẾT QUẢ MONG ĐỢI**:
- Chỉ nhận 1 tin nhắn từ bot: "Chào bạn! Tôi có thể giúp gì..."
- KHÔNG có tin nhắn "✅ Cảm ơn đánh giá..."
- KHÔNG lưu vào Google Sheets

**Log trong Terminal sẽ thấy**:
```
[Workflow] Gemini result: isFeedback=false
[Workflow] Filter #1 result: PASS
[Workflow] Executing Telegram #1 (response chính)
[Workflow] ⏭️ Skipping Google Sheets (condition not met: reject)
[Workflow] ⏭️ Skipping Filter #2 (condition not met: reject)
[Workflow] ⏭️ Skipping Telegram #2 (source node not executed)
```

#### **Test 2: Feedback tích cực**
Gửi Telegram: `10 điểm! Tuyệt vời!`

**✅ KẾT QUẢ MONG ĐỢI**:
- Nhận 1 tin nhắn: "✅ Cảm ơn đánh giá của bạn! Đã lưu phản hồi: Sheet1!A2"
- Google Sheets có thêm 1 dòng mới
- Sentiment: positive

**Log sẽ thấy**:
```
[Workflow] Gemini result: isFeedback=true, sentiment=positive
[Workflow] Filter #1 result: REJECT
[Workflow] Executing Google Sheets
[Workflow] Executing Filter #2
[Workflow] Filter #2 result: PASS (no negative)
[Workflow] Executing Telegram #1 (thank you message)
```

#### **Test 3: Feedback tiêu cực**
Gửi Telegram: `2 điểm, rất tệ`

**✅ KẾT QUẢ MONG ĐỢI**:
- Nhận 1 tin nhắn: "😔 Chúng tôi rất tiếc... Đã lưu phản hồi: Sheet1!A3"
- Google Sheets có thêm 1 dòng mới
- Sentiment: negative

**Log sẽ thấy**:
```
[Workflow] Gemini result: isFeedback=true, sentiment=negative
[Workflow] Filter #1 result: REJECT
[Workflow] Executing Google Sheets
[Workflow] Executing Filter #2
[Workflow] Filter #2 result: REJECT (has negative)
[Workflow] Executing Telegram #2 (apology message)
```

---

## 📝 SYSTEM PROMPT MỚI CHO GEMINI (Quan trọng!)

**Vào UI → Click node Gemini → Sửa System Prompt thành:**

```
Bạn là chatbot tư vấn sản phẩm thông minh.

QUY TẮC PHẢN HỒI:

1. NẾU tin nhắn là FEEDBACK (có số điểm 1-10, hoặc từ "tốt/tệ/đánh giá/rating"):
   → Trả về JSON (KHÔNG giải thích gì thêm):
   {
     "is_feedback": true,
     "sentiment": "positive hoặc negative hoặc neutral",
     "score": [ĐIỂM 1-10],
     "original_text": "tin nhắn gốc của user"
   }
   
   CÁCH CHẤM ĐIỂM:
   - NẾU tin nhắn có SỐ (1-10): Dùng số đó làm score
   - NẾU KHÔNG có số:
     * Rất tốt/tuyệt vời/xuất sắc → 9-10 điểm
     * Tốt/hay/ổn → 7-8 điểm
     * Bình thường/được → 5-6 điểm
     * Tệ/kém/chán → 2-4 điểm
     * Rất tệ/tồi tệ/khủng khiếp → 1 điểm

2. NẾU là CÂU HỎI bình thường:
   → Trả lời câu hỏi
   → Trả về: {"is_feedback": false, "response": "câu trả lời của bạn"}
```

## 🎯 LOGIC WORKFLOW SAU KHI SỬA

```
┌─────────────┐
│   Gemini    │ → Parse JSON, return isFeedback (boolean), score (1-10)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   Filter #1      │ Check: {{gemini-1.isFeedback}} vs keyword "true"
│ (Check Feedback) │
└────┬───────┬─────┘
     │       │
PASS │       │ REJECT
     │       │ (isFeedback = true)
     │       │
     │       ▼
     │   ┌────────────────┐
     │   │ Google Sheets  │ Lưu feedback
     │   └────────┬───────┘
     │            │
     │            ▼
     │   ┌────────────────┐
     │   │   Filter #2    │ Check: {{gemini-1.rawResponse}} vs "sentiment": "negative"
     │   │  (Sentiment)   │
     │   └────┬───────┬───┘
     │        │       │
     │   PASS │       │ REJECT
     │        │       │ (negative)
     │        │       │
     │        ▼       ▼
     │   ┌────────────────┐
     └──→│  Telegram #1   │ Response chính / Thank you positive
         │ (Gemini answer)│
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Telegram #2   │ Apology message (negative)
         └────────────────┘
```

---

## 🐛 DEBUG - NẾU VẪN BỊ LỖI

### **Kiểm tra Log Chi Tiết**

Mở Terminal worker, tìm dòng:
```
[Workflow] Config after template evaluation:
```

**1. Kiểm tra Filter #1 Input**:
```json
{
  "inputText": "true",  // ✅ ĐÚNG (hoặc "false")
  "keywords": ["true"],
  "caseSensitive": false
}
```

**❌ NẾU THẤY**:
```json
{
  "inputText": "```json\n{\"is_feedback\": false...}```",  // SAI!
  ...
}
```
→ Bạn chưa sửa Filter #1 input, quay lại Bước 2

**2. Kiểm tra Filter #1 Result**:
```
[Workflow] ContentFilter result: PASS
```
hoặc
```
[Workflow] ContentFilter result: REJECT
```

**3. Kiểm tra Condition Check**:
```
[Workflow] Checking condition for SHEETS_googleSheets-...: contentFilter-... (filter-1) must be reject
[Workflow] ✅ Condition met, executing SHEETS_...
```
→ ✅ ĐÚNG: Sheets chỉ chạy khi filter-1 = REJECT

**❌ NẾU THẤY**:
```
[Workflow] Checking condition for SHEETS_googleSheets-...: contentFilter-... (filter-1) must be pass
```
→ Edge bị ngược! Cần vào UI sửa lại edges (kéo lại từ REJECT → Sheets)

---

## 📊 CHECKLIST - XÁC NHẬN ĐÃ SỬA ĐÚNG

- [ ] Filter #1 input = `{{gemini-1.isFeedback}}`
- [ ] Filter #1 keywords = `true` (1 dòng)
- [ ] Filter #2 input = `{{gemini-1.rawResponse}}`
- [ ] Filter #2 keywords = `"sentiment": "negative"` (1 dòng)
- [ ] Đã click "💾 Lưu cấu hình" cho Filter #1
- [ ] Đã click "🚀 Deploy" workflow
- [ ] Đã restart worker (`npm run dev`)
- [ ] Test "hello" → Chỉ 1 tin nhắn Gemini
- [ ] Test "10 điểm" → 1 tin nhắn thank you + lưu Sheets
- [ ] Log không còn lỗi `Google Sheets APPEND failed`

---

## 💡 GHI CHÚ KỸ THUẬT

### **Tại sao phải check `isFeedback` thay vì `rawResponse`?**

Gemini trả về JSON có markdown backticks:
```
```json
{
  "is_feedback": false,
  "response": "Xin chào!"
}
```
```

Code đã parse và extract ra:
- `{{gemini-1.response}}` = "Xin chào!"
- `{{gemini-1.isFeedback}}` = `false` (boolean)
- `{{gemini-1.rawResponse}}` = cả đoạn JSON với backticks

→ Check `isFeedback` (boolean) vs keyword "true" (string) → Filter hoạt động như mong đợi
→ Check `rawResponse` (JSON text) vs `"is_feedback": true` → Dễ bị lỗi format

### **Logic PASS vs REJECT của Content Filter**

Content Filter hoạt động như **blacklist**:
- Input chứa keyword → **REJECT** (vi phạm)
- Input không chứa keyword → **PASS** (sạch)

Áp dụng cho workflow:
- `isFeedback = "true"` → Tìm thấy "true" → **REJECT** → Đây là feedback
- `isFeedback = "false"` → Không tìm thấy "true" → **PASS** → Đây là câu hỏi

---

## 🎉 KẾT QUẢ SAU KHI SỬA

✅ Câu hỏi thường: Chỉ reply 1 tin nhắn Gemini
✅ Feedback positive: Lưu Sheets + gửi thank you
✅ Feedback negative: Lưu Sheets + gửi apology
✅ Template `{{sheets-1.updatedRange}}` được resolve đúng
✅ Không còn lỗi undefined condition check

---

**Tác giả**: GitHub Copilot
**Ngày tạo**: 5/12/2025
**Version**: Final Fix v1.0

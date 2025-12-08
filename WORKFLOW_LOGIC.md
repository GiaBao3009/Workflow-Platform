# WORKFLOW LOGIC - Telegram Bot với Gemini AI

## YÊU CẦU LOGIC

### Khi user gửi tin nhắn:

**TRƯỜNG HỢP 1: TIN NHẮN LÀ FEEDBACK (đánh giá)**
- User nhắn: "Tôi đánh giá 8 điểm", "Dịch vụ tốt", "Rating 10/10"
- Gemini nhận diện → Trả về JSON:
  ```json
  {
    "is_feedback": true,
    "sentiment": "positive",
    "score": 8,
    "original_text": "Tôi đánh giá 8 điểm"
  }
  ```
- ✅ **LƯU VÀO GOOGLE SHEETS** (timestamp, chatId, message, feedback data)
- ✅ **GỬI TELEGRAM**: "Cảm ơn đánh giá của bạn! Chúng tôi rất vui khi bạn hài lòng! 😊"

**TRƯỜNG HỢP 2: TIN NHẮN LÀ CÂU HỎI BÌNH THƯỜNG**
- User nhắn: "Bạn là ai?", "Sản phẩm nào tốt?", "Hello"
- Gemini trả lời → Trả về JSON:
  ```json
  {
    "is_feedback": false,
    "response": "Tôi là chatbot tư vấn sản phẩm thông minh..."
  }
  ```
- ❌ **KHÔNG LƯU VÀO GOOGLE SHEETS** (vì không phải feedback)
- ✅ **GỬI TELEGRAM**: Response từ Gemini

---

## WORKFLOW NODES (7 NODES)

### Node 1: BẮT ĐẦU (Trigger)
- Type: `input`
- Nhận webhook từ Telegram
- Output: `webhook` object với message, chatId, text

### Node 2: GEMINI AI
- ID: `gemini-1764521667996`
- Alias: `gemini-1`
- Input: `{{webhook.message.text}}`
- Output:
  ```javascript
  {
    response: "text response",      // Text đã parse
    rawResponse: "full JSON",       // JSON gốc
    isFeedback: true/false,         // Flag để check
    feedbackData: {...},            // Data nếu là feedback
    tokens: 123
  }
  ```

### Node 3: LỌC NỘI DUNG #1 (Check if Feedback)
- ID: `contentFilter-1764521662706`
- Alias: `filter-1`
- Input: `{{gemini-1.rawResponse}}` ← **CHECK JSON GỐC**
- Keywords: `"is_feedback": true` ← **TÌM TEXT NÀY**
- Logic:
  - **PASS** (tìm thấy `"is_feedback": true`) → Đây là FEEDBACK → Chạy Google Sheets
  - **REJECT** (không tìm thấy) → Đây là câu hỏi thường → Skip Google Sheets

### Node 4: GOOGLE SHEETS
- ID: `googleSheets-1764763086789`
- Alias: `sheets-1`
- **Condition**: Chỉ chạy khi `filter-1 = PASS` (là feedback)
- Action: APPEND
- Data: Timestamp, Username, ChatId, Message, Gemini Response, Score

### Node 5: LỌC NỘI DUNG #2 (Check Negative Sentiment)
- ID: `contentFilter-1764763109206`
- Alias: `filter-3`
- **Condition**: Chỉ chạy khi `filter-1 = PASS` (là feedback)
- Input: `{{gemini-1.rawResponse}}`
- Keywords: `"sentiment": "negative"`
- Logic:
  - **PASS** (không có negative) → Feedback tích cực
  - **REJECT** (có negative) → Feedback tiêu cực

### Node 6: TELEGRAM #1 (Response bình thường)
- ID: `telegram-1764763114276`
- Alias: `telegram-1`
- **Condition**: Chạy khi `filter-3 = PASS` (feedback tích cực) HOẶC `filter-1 = REJECT` (câu hỏi thường)
- ChatId: `{{webhook.message.chat.id}}`
- Text: `{{gemini-1.response}}` ← **Trả lời từ Gemini**

### Node 7: TELEGRAM #2 (Message cảm ơn feedback)
- ID: `telegram-1764521676036`
- **Condition**: Chạy khi `filter-3 = REJECT` (feedback tiêu cực)
- ChatId: `{{webhook.message.chat.id}}`
- Text: 
  ```
  ✅ Cảm ơn đánh giá của bạn!
  
  Chúng tôi rất vui khi bạn hài lòng! 😊
  
  ✅ Đã lưu: {{sheets-1.updatedRange}}
  ```

---

## LUỒNG THỰC THI

### FLOW 1: User hỏi "Bạn là ai?"
```
1. Trigger (webhook) → text = "Bạn là ai?"
2. Gemini → {is_feedback: false, response: "Tôi là chatbot..."}
3. Filter #1 check rawResponse → Không tìm thấy "is_feedback": true → REJECT
4. Google Sheets → SKIP (vì condition filter-1=PASS không thỏa)
5. Filter #2 → SKIP (vì condition filter-1=PASS không thỏa)
6. Telegram #1 → SKIP (cần sửa condition)
7. Bot trả lời: "Tôi là chatbot..."
```

### FLOW 2: User feedback "Dịch vụ tốt 9 điểm"
```
1. Trigger (webhook) → text = "Dịch vụ tốt 9 điểm"
2. Gemini → {is_feedback: true, sentiment: "positive", score: 9}
3. Filter #1 check rawResponse → Tìm thấy "is_feedback": true → PASS
4. Google Sheets → CHẠY (lưu feedback vào sheet) → updatedRange = "Sheet1!A5"
5. Filter #2 check "sentiment": "negative" → Không tìm thấy → PASS
6. Telegram #1 → SKIP (hoặc gửi response)
7. Telegram #2 → SKIP (vì filter-3=REJECT không thỏa)
8. Bot trả lời: "Cảm ơn đánh giá..."
```

---

## VẤN ĐỀ HIỆN TẠI

### ❌ Filter #1 check SAI FIELD
**Hiện tại:**
- Field "Nội dung cần kiểm tra": `{{gemini-1.response}}`
- Từ khóa: `is_feedback": true`
- Gemini trả về: `{isFeedback: false, response: "Tôi là chatbot..."}`
- Filter nhận: `"Tôi là chatbot..."` (text thuần, không có JSON structure)
- Kết quả: KHÔNG BAO GIỜ tìm thấy `is_feedback": true` → Luôn PASS

**Cần sửa:**
- Field "Nội dung cần kiểm tra": `{{gemini-1.isFeedback}}`
- Từ khóa: `true`
- Filter nhận: `false` hoặc `true` (boolean as string)
- Kết quả: Tìm thấy `true` khi là feedback → REJECT → Chạy Sheets ✅

### Tại sao phải check `isFeedback` thay vì `response`?

Code trong `activities.ts` đã parse JSON và extract ra 2 fields:
```typescript
return {
  response: aiResponse,      // ← Text thuần: "Tôi là chatbot..."
  rawResponse: rawResponse,  // ← JSON gốc: {"is_feedback": false, ...}
  isFeedback,                // ← Boolean: true/false
  feedbackData,              
  tokens: tokensUsed,
}
```

Filter chỉ có thể check **text/string**, không check được boolean trực tiếp. Nên:
- `{{gemini-1.isFeedback}}` → Convert boolean thành string: `"true"` hoặc `"false"`
- Keywords tìm `true` → Chỉ match khi là feedback

### ⚠️ Lưu ý về PASS/REJECT logic

Trong UI, Filter có 2 outputs:
- **PASS (chấm xanh)**: Không tìm thấy keywords → Nội dung sạch
- **REJECT (chấm đỏ)**: Tìm thấy keywords → Nội dung vi phạm

**Với Filter #1 check feedback:**
- Keywords: `true`
- Tìm thấy `true` → **REJECT** → Là feedback → Chạy Sheets ✅
- Không tìm thấy (là `false`) → **PASS** → Câu hỏi thường → Skip Sheets ✅

**Flow đúng:**
```
Filter #1 (check isFeedback)
├─ PASS (false) → Telegram #1 (trả lời câu hỏi)
└─ REJECT (true) → Google Sheets → Filter #2 → Telegram (message cảm ơn)
```

---

## CÁCH SỬA (TRÊN FRONTEND UI)

### Bước 1: Sửa Filter #1 (Lọc Nội Dung #1)

1. Mở workflow trên UI: http://localhost:5173
2. Click vào node **Lọc Nội Dung #1** (contentFilter-1764521662706)
3. Trong panel config bên phải, tìm field **"Nội dung cần kiểm tra"**
4. Đổi giá trị từ:
   - ❌ Cũ: `{{gemini-1.response}}`
   - ✅ Mới: `{{gemini-1.isFeedback}}`
   
5. Click nút **📦** (helper) → Chọn node **gemini-1** → Chọn variable **isFeedback**
   - Hoặc gõ tay: `{{gemini-1.isFeedback}}`

6. Field **"Từ khóa nhạy cảm"** đổi thành:
   - ❌ Cũ: `is_feedback": true`
   - ✅ Mới: `true` (chỉ 1 dòng)

7. Click **💾 Lưu cấu hình**

### Giải thích:
- `{{gemini-1.isFeedback}}` sẽ return `true` hoặc `false` (boolean)
- Filter sẽ tìm text `true` trong value đó
- Nếu tìm thấy `true` → REJECT (là feedback) → Chạy Google Sheets
- Nếu không tìm thấy (là `false`) → PASS → Skip Google Sheets

### Bước 2: Kiểm tra edges (đường nối)

Xem workflow canvas, đảm bảo:
- **Filter #1 (REJECT output - chấm đỏ)** → Nối đến **Google Sheets**
- **Google Sheets** → Nối đến **Filter #2**
- **Filter #2 (PASS output - chấm xanh)** → Nối đến **Telegram #1**
- **Filter #2 (REJECT output - chấm đỏ)** → Nối đến **Telegram #2**

Nếu thiếu edge nào:
1. Kéo từ chấm output node này → Thả vào node tiếp theo
2. Đảm bảo chọn đúng output (PASS/REJECT)

### Bước 3: Test workflow

**Test 1: Câu hỏi bình thường**
- Gửi bot: "Bạn là ai?"
- Kết quả mong đợi:
  - ✅ Bot trả lời: "Tôi là chatbot tư vấn sản phẩm..."
  - ❌ KHÔNG lưu vào Google Sheets
  - Check Sheets → Không có dòng mới

**Test 2: Feedback tích cực**
- Gửi bot: "Tôi đánh giá 9 điểm"
- Kết quả mong đợi:
  - ✅ Lưu vào Google Sheets (timestamp, chatId, message, score: 9)
  - ✅ Bot trả lời: "Cảm ơn đánh giá của bạn! ✅ Đã lưu: Sheet1!A5"
  - Check Sheets → Có dòng mới

**Test 3: Feedback tiêu cực**
- Gửi bot: "Dịch vụ tệ, 2 điểm"
- Kết quả mong đợi:
  - ✅ Lưu vào Google Sheets
  - ✅ Bot trả lời message cảm ơn (từ Telegram #2)

---

## KẾT QUẢ MONG MUỐN

| User Input | Gemini Output | Lưu Sheets? | Bot Response |
|-----------|---------------|-------------|--------------|
| "Bạn là ai?" | `{is_feedback: false, response: "..."}` | ❌ KHÔNG | "Tôi là chatbot..." |
| "Sản phẩm nào tốt?" | `{is_feedback: false, response: "..."}` | ❌ KHÔNG | Response từ Gemini |
| "Tôi đánh giá 8 điểm" | `{is_feedback: true, sentiment: "positive", score: 8}` | ✅ CÓ | "Cảm ơn đánh giá..." |
| "Dịch vụ tệ" | `{is_feedback: true, sentiment: "negative", score: 3}` | ✅ CÓ | "Cảm ơn phản hồi..." |

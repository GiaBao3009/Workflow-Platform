# 🧪 Test Workflow: Smart Chatbot with Auto Survey

## 🎯 Use Case: Chatbot tự động hỏi đánh giá

**Kịch bản thực tế:**
1. User chat bình thường với bot (hỏi đáp về sản phẩm/dịch vụ)
2. Bot đếm số tin nhắn của user trong ngày
3. Sau **7 tin nhắn** → Bot **tự động hỏi đánh giá** (chỉ 1 lần/ngày)
4. User trả lời đánh giá
5. Gemini AI phân tích sentiment
6. Lưu vào Google Sheets
7. Bot phản hồi phù hợp

**Flow tự nhiên:**
```
User: "Giá sản phẩm X bao nhiêu?"
Bot: "Sản phẩm X giá 500k..." [Đếm: 1]

User: "Có màu nào?"
Bot: "Có 3 màu: đỏ, xanh, vàng..." [Đếm: 2]

User: "Giao hàng mất bao lâu?"
Bot: "2-3 ngày..." [Đếm: 3]

... (4 câu nữa)

User: "Có bảo hành không?"
Bot: "Bảo hành 12 tháng..." [Đếm: 7]

Bot: "✨ Bạn đã chat với mình 7 tin nhắn rồi! 
      Bạn đánh giá trải nghiệm thế nào? (1-10 hoặc feedback tự do)"

User: "Rất tốt! Bot trả lời nhanh và chi tiết. 9/10"
Bot: "✅ Cảm ơn feedback của bạn! Đã lưu vào hệ thống."
→ Lưu vào Google Sheets
→ Reset counter, ngày mai mới hỏi lại
```

**Logic thông minh:**
- ✅ Đếm số tin nhắn theo **user ID + ngày** (mỗi user riêng, mỗi ngày reset)
- ✅ Chỉ hỏi đánh giá **1 lần/ngày/user**
- ✅ Sau 7 tin nhắn (đủ để đánh giá trải nghiệm)
- ✅ Conversation memory để bot nhớ context

---

## 📋 Bước 1: Tạo Google Sheets

1. Vào https://sheets.google.com → Tạo sheet mới
2. Đặt tên: **"Chat Feedback"**
3. Tạo header (dòng 1):

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Timestamp | Username | Chat ID | Feedback | Sentiment | Score |

4. **Share sheet:**
   - Click **"Share"** → **"Anyone with the link"** → **Editor**
   - Copy link

5. **Lấy Spreadsheet ID:**
   - URL dạng: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdD.../edit`
   - Copy phần: `1BxiMVs0XRA5nFMdKvBdD...`

---

## 🏗️ Bước 2: Tạo Workflow (Đơn giản cho test)

### **Khởi động services** (3 terminals):

**Terminal 1:**
```cmd
cd c:\Users\baold\Desktop\my-workflow-platform\hello-temporal
npm run dev
```

**Terminal 2:**
```cmd
cd c:\Users\baold\Desktop\my-workflow-platform\apps\backend-api
npm run dev
```

**Terminal 3:**
```cmd
cd c:\Users\baold\Desktop\my-workflow-platform\apps\frontend
npm run dev
```

### **Mở UI:** http://localhost:5173

---

## 💡 Workflow ALL-IN-ONE: Gemini thông minh xử lý tất cả

**Ý tưởng:**
- 1 workflow duy nhất xử lý cả chat + feedback
- Gemini tự phân biệt: câu hỏi vs feedback
- Tự đếm tin nhắn, tự hỏi đánh giá sau 7 tin nhắn
- Tự lưu feedback vào Google Sheets

**Workflow đơn giản (CHỈ 6 NODES):**

```
[📨 Webhook] 
     ↓
[⚡ Groq AI] ← System Prompt thông minh (MIỄN PHÍ & NHANH)
     |        (Tự phân biệt chat vs feedback)
     ↓
[🔍 Filter] ← Check: Có phải feedback không?
     |
     ├─→ REJECT (Chat) → [📱 Telegram] Reply thường
     |
     └─→ PASS (Feedback) 
              ↓
         [📊 Sheets] Lưu feedback
              ↓
         [🔍 Filter] Check negative
              ↓ PASS    ↓ REJECT
         [📱 Telegram] [📱 Telegram]
         "Xin lỗi"     "Cảm ơn"
```

---

## ⚙️ Bước 3: Kéo nodes vào Canvas

Vào http://localhost:5173 → Kéo 6 nodes theo thứ tự:

```
[Webhook] → [⚡ Groq AI] → [Content Filter] → [Telegram]
                              ↓ PASS
                         [Google Sheets]
                              ↓
                         [Content Filter]
                           ↓ PASS  ↓ REJECT
                        [Telegram] [Telegram]
```

**Kết nối:**
1. Webhook → Groq AI
2. Groq → Content Filter (filter-check-feedback)
3. Filter REJECT → Telegram (chat thường)
4. Filter PASS → Google Sheets
5. Sheets → Content Filter (filter-negative)
6. Filter PASS → Telegram (feedback negative)
7. Filter REJECT → Telegram (feedback positive)

---

## ⚙️ Bước 4: Config từng Node

### **Node 1: Webhook**
- Click node Webhook
- Alias: `webhook-1`
- Save
- Copy webhook URL

### **Node 2: ⚡ Groq AI (MIỄN PHÍ & CỰC NHANH)**
- Click node Groq AI
- **Model:** `llama-3.3-70b-versatile` (mạnh nhất)
- **System Prompt:**
  ```
  Bạn là chatbot tư vấn sản phẩm thông minh.
  
  QUY TẮC PHẢN HỒI:
  
  1. NẾU tin nhắn là FEEDBACK (có số điểm 1-10, hoặc từ "tốt/tệ/đánh giá/rating"):
     → Trả về JSON (KHÔNG giải thích gì thêm):
     {
       "is_feedback": true,
       "sentiment": "positive hoặc negative hoặc neutral",
       "score": <số từ 1-10>,
       "original_text": "tin nhắn gốc của user"
     }
     
     QUY TẮC CHO ĐIỂM (score):
     - User nói rõ số điểm ("9/10", "8 điểm") → Dùng số đó
     - User nói "rất tốt", "xuất sắc", "hoàn hảo" → 9-10 điểm
     - User nói "tốt", "hài lòng", "ổn" → 7-8 điểm
     - User nói "bình thường", "tạm được" → 5-6 điểm
     - User nói "chán", "không tốt", "thất vọng" → 3-4 điểm
     - User nói "tệ", "quá tệ", "rất tệ" → 1-2 điểm
     - Phân tích context: "cập nhật chậm" = 4 điểm, "lỗi nhiều" = 3 điểm
  
  2. NẾU là CÂU HỎI bình thường:
     → Đếm số tin nhắn trong conversation history
     → Trả lời câu hỏi
     → NẾU đủ 7 tin nhắn VÀ chưa hỏi đánh giá hôm nay:
        THÊM vào cuối response:
        "---
        ✨ Bạn đánh giá trải nghiệm chat thế nào? (1-10 hoặc feedback tự do)"
     → Trả về: {"is_feedback": false, "response": "câu trả lời của bạn"}
  
  CHỈ hỏi đánh giá 1 LẦN/NGÀY.
  
  THÔNG TIN SẢN PHẨM:
  - iPhone 15: 24tr, giao 2-3 ngày, bảo hành 12 tháng
  - Samsung S24: 20tr, giao 2-3 ngày, bảo hành 12 tháng
  - Laptop Dell: 15tr, giao 3-5 ngày, bảo hành 24 tháng
  ```
- **User Message:** `{{webhook.message.text}}`
- **Temperature:** `0.7`
- **Max Tokens:** `2048`
- **Use Conversation History:** ✅ **BẬT**
- **Chat ID:** `{{webhook.message.chat.id}}`
- Alias: `groq-1`
- Save

### **Node 3: Content Filter #1 - Phân biệt chat vs feedback**
- Click node Content Filter
- **Check Text:** `{{groq-1.response}}`
- **Banned Words:** `"is_feedback": true`
- Alias: `filter-check-feedback`
- Save

> **Logic:** PASS = là feedback → Lưu Sheets. REJECT = chat thường → Reply Telegram

### **Node 4: Telegram - Reply chat thường (từ filter REJECT)**
- Kết nối từ **filter-check-feedback REJECT**
- **Message:** `{{groq-1.response}}`
- **Chat ID:** `{{webhook.message.chat.id}}`
- Alias: `telegram-chat`
- Save

### **Node 5: Google Sheets - Lưu feedback (từ filter PASS)**
- Kết nối từ **filter-check-feedback PASS**
- **Spreadsheet ID:** `1BxiMVs0XRA5nFMdKvBdD...` (paste ID từ bước 1)
- **Action:** `APPEND`
- **Sheet Name:** `Sheet1`
- **Range:** `A:F`
- **Values:** Click 📦:
  ```json
  [["{{workflow.timestamp}}", "{{webhook.message.from.username}}", "{{webhook.message.chat.id}}", "{{webhook.message.text}}", "{{groq-1.response}}", "{{groq-1.response}}"]]
  ```
  
  > 💡 **Cột F (Score):** AI tự động phân tích và cho điểm 1-10 dựa trên feedback. JSON chứa field "score". Bạn có thể dùng Google Sheets formula để extract số điểm:
  > ```
  > =REGEXEXTRACT(F2, ""score"":\s*(\d+)")
  > ```
- Alias: `sheets-1`
- Save

### **Node 6: Content Filter #2 - Check negative**
- Kết nối từ **sheets-1**
- **Check Text:** `{{groq-1.response}}`
- **Banned Words:** `"sentiment": "negative"`
- Alias: `filter-negative`
- Save

### **Node 7: Telegram - Feedback negative (từ filter PASS)**
- Kết nối từ **filter-negative PASS**
- **Message:**
  ```
  😔 Chúng tôi rất tiếc khi bạn không hài lòng!
  
  Team support sẽ xem xét và cải thiện ngay.
  Cảm ơn feedback của bạn! 🙏
  
  ✅ Đã lưu: {{sheets-1.updatedRange}}
  ```
- **Chat ID:** `{{webhook.message.chat.id}}`
- Alias: `telegram-negative`
- Save

### **Node 8: Telegram - Feedback positive (từ filter REJECT)**
- Kết nối từ **filter-negative REJECT**
- **Message:**
  ```
  ✅ Cảm ơn đánh giá của bạn!
  
  Chúng tôi rất vui khi bạn hài lòng! 😊
  
  ✅ Đã lưu: {{sheets-1.updatedRange}}
  ```
- **Chat ID:** `{{webhook.message.chat.id}}`
- Alias: `telegram-positive`
- Save

---

## 💾 Bước 5: Save và Deploy

1. Tên workflow: **"Smart Chat with Auto Survey"**
2. Click **💾 Lưu Workflow**
3. Click **🚀 Deploy**
4. Copy webhook URL
5. Set Telegram webhook:
   ```cmd
   node set-telegram-webhook.js https://your-ngrok-url.ngrok-free.dev
   ```

---

## 🧪 Bước 6: Test Flow

### **Scenario: Chat bình thường**

Gửi vào Telegram:
```
User: "iPhone 15 giá bao nhiêu?"
Bot: "iPhone 15 giá 24 triệu, giao 2-3 ngày, bảo hành 12 tháng.

     ---
     ✨ Bạn đánh giá trải nghiệm chat thế nào? (1-10)"
```

**GỬI THÊM 6 TIN NHẮN:**
```
User: "Có màu nào?"
Bot: "Có 4 màu..."

User: "Có trả góp không?"
Bot: "Có trả góp 0%..."

... (4 câu nữa)

User: "Bảo hành thế nào?"
Bot: "Bảo hành 12 tháng..."

     ---  
     ✨ Bạn đánh giá trải nghiệm chat thế nào? (1-10)"
     ↑ Câu hỏi này chỉ xuất hiện sau tin nhắn thứ 7!
```

### **Scenario: Gửi feedback Positive**

```
User: "9/10 rất tốt!"
Bot: "✅ Cảm ơn feedback của bạn!
     
     ⚡ Groq AI phân tích: {"sentiment":"positive"...}
     ✅ Đã lưu vào hệ thống: Sheet1!A2"
```

→ Check Google Sheets có dòng mới!

### **Scenario: Gửi feedback Negative**

```
User: "2/10 bot trả lời chậm quá!"
Bot: "😔 Chúng tôi rất tiếc!
     
     Team sẽ liên hệ bạn để cải thiện dịch vụ.
     ✅ Đã lưu feedback: Sheet1!A3"
```

→ Check Google Sheets có dòng mới!

---

## 📊 Kết quả trong Google Sheets

Feedback	Score
"Rất tốt", "xuất sắc", "hoàn hảo"	9-10
"Tốt", "hài lòng", "ổn"	7-8
"Bình thường", "tạm được"	5-6
"Chán", "không tốt", "thất vọng"	3-4
"Tệ", "rất tệ", "quá tệ"	1-2
"Cập nhật chậm", "lỗi nhiều"	3-4

### 📐 Extract Score Number (Optional)
Thêm cột G với formula để lấy chỉ số điểm:
```
=REGEXEXTRACT(F2, "score"":\s*(\d+)")
```
Kết quả: `9`, `3`, `4`, `9`

---

## 💡 Logic thông minh của Groq AI (MIỄN PHÍ)

**Groq AI tự động:**
1. ✅ Đếm số tin nhắn trong conversation history
2. ✅ Sau 7 tin nhắn → Tự chèn câu hỏi đánh giá
3. ✅ Chỉ hỏi 1 lần/ngày (check timestamp trong history)
4. ✅ Phân biệt câu hỏi vs feedback
5. ✅ Phân tích sentiment của feedback
6. ✅ **TỰ ĐỘNG CHO ĐIỂM 1-10:**
   - User nói rõ số → Dùng số đó ("9/10" = 9 điểm)
   - User mô tả cảm xúc → AI phân tích:
     * "Rất tốt" = 9-10 điểm
     * "Tốt" = 7-8 điểm
     * "Bình thường" = 5-6 điểm
     * "Chán" = 3-4 điểm
     * "Tệ" = 1-2 điểm
   - Context-aware: "Cập nhật chậm" = 4 điểm, "Lỗi nhiều" = 3 điểm
7. ✅ Inference < 1 giây (cực nhanh!)
8. ✅ 14,400 requests/day miễn phí

**Không cần:**
- ❌ Node đếm tin nhắn
- ❌ Database lưu counter
- ❌ Logic phức tạp

**Chỉ cần:**
- ✅ System Prompt thông minh
- ✅ Conversation Memory (đã có)
- ✅ Google Sheets lưu kết quả

---

### **Node 3: Google Sheets**
- Click node Google Sheets
- **Spreadsheet ID:** `1BxiMVs0XRA5nFMdKvBdD...` (paste ID từ bước 1)
- **Action:** `APPEND`
- **Sheet Name:** `Sheet1`
- **Range:** `A:F`
- **Values:** Click nút **📦**:
  ```json
  [["{{workflow.timestamp}}", "{{webhook.message.from.username}}", "{{webhook.message.chat.id}}", "{{webhook.message.text}}", "{{gemini-1.response}}", "{{gemini-1.response}}"]]
  ```
- Alias: `sheets-1`
- Save

> 💡 **Logic:** Chỉ lưu khi `is_feedback: true` trong response

### **Node 4: Content Filter #1 - Check nếu là feedback**
- Click node Content Filter
- **Check Text:** `{{gemini-1.response}}`
- **Banned Words:** `"is_feedback": true`
- Alias: `filter-1`
- Save

> 💡 Nếu PASS → Đây là feedback, xử lý tiếp. Nếu REJECT → Chỉ là chat bthg, reply luôn.

### **Node 5: Content Filter #2 - Check negative (chỉ chạy nếu là feedback)**
- Kết nối từ **filter-1 PASS** → filter-2
- **Check Text:** `{{gemini-1.response}}`
- **Banned Words:** `"sentiment": "negative"`
- Alias: `filter-2`
- Save

### **Node 6a: Telegram - Reply chat bình thường (filter-1 REJECT)**
- Kết nối từ **filter-1 REJECT**
- **Message:**
  ```
  {{gemini-1.response}}
  ```
- **Chat ID:** `{{webhook.message.chat.id}}`
- Save

> Bot sẽ tự động trả lời + hỏi đánh giá trong 1 tin nhắn

### **Node 6b: Telegram - Feedback negative (filter-2 PASS)**
- Kết nối từ **filter-2 PASS**
- **Message:**
  ```
  😔 Chúng tôi rất tiếc khi bạn không hài lòng!
  
  Team support sẽ xem xét và cải thiện ngay.
  Cảm ơn feedback của bạn! 🙏
  
  ✅ Đã lưu: {{sheets-1.updatedRange}}
  ```
- **Chat ID:** `{{webhook.message.chat.id}}`
- Save

### **Node 6c: Telegram - Feedback positive/neutral (filter-2 REJECT)**
- Kết nối từ **filter-2 REJECT**
- **Message:**
  ```
  ✅ Cảm ơn đánh giá của bạn!
  
  Chúng tôi rất vui khi bạn hài lòng với dịch vụ! 😊
  
  ✅ Đã lưu: {{sheets-1.updatedRange}}
  ```
- **Chat ID:** `{{webhook.message.chat.id}}`
- Save

---

## 💾 Bước 4: Save và Deploy

1. Đặt tên workflow: **"Customer Survey"**
2. Click **"💾 Lưu Workflow"**
3. Click **"🚀 Deploy"**
4. Đợi toast: "Workflow deployed successfully"

---

## 🧪 Bước 5: Test 3 Cases

### **Test 1: Positive Feedback ✅**
Gửi vào Telegram bot:
```
Dịch vụ tuyệt vời! Nhân viên nhiệt tình, giao hàng nhanh chóng. Rất hài lòng! 10/10
```

**Kết quả:**
- ✅ Gemini phân tích: `{"sentiment":"positive", "score":10, ...}`
- ✅ Google Sheets có dòng mới
- ✅ Bot reply: "Cảm ơn phản hồi của bạn!"
- ✅ Filter REJECT (không có "negative")

### **Test 2: Negative Feedback ❌**
Gửi vào Telegram bot:
```
Rất thất vọng! Giao hàng trễ 3 ngày, sản phẩm bị hỏng, nhân viên support không phản hồi.
```

**Kết quả:**
- ✅ Gemini: `{"sentiment":"negative", "score":2, ...}`
- ✅ Google Sheets có dòng mới
- ✅ Bot reply: "😔 Chúng tôi rất tiếc..."
- ✅ Filter PASS (có từ "negative")

### **Test 3: Neutral Feedback ⚪**
Gửi vào Telegram bot:
```
Sản phẩm bình thường, không có gì đặc biệt. Tạm ổn.
```

**Kết quả:**
- ✅ Gemini: `{"sentiment":"neutral", "score":5, ...}`
- ✅ Google Sheets có dòng mới
- ✅ Bot reply: "Cảm ơn phản hồi của bạn!"
- ✅ Filter REJECT (không có "negative")

---

## 📊 Bước 7: Xem Kết Quả

Mở Google Sheets, bạn sẽ thấy:

| Timestamp | Customer | Feedback | Sentiment | AI Analysis |
|-----------|----------|----------|-----------|-------------|
| 2025-12-03 10:30 | baold | Dịch vụ tuyệt vời! | {"sentiment":"positive"...} | {"sentiment":"positive"...} |
| 2025-12-03 10:32 | baold | Rất thất vọng! | {"sentiment":"negative"...} | {"sentiment":"negative"...} |
| 2025-12-03 10:35 | baold | Sản phẩm bình thường | {"sentiment":"neutral"...} | {"sentiment":"neutral"...} |

**Bạn có thể:**
- Filter theo sentiment column
- Tạo pivot table để thống kê
- Chart sentiment distribution
- Export báo cáo hàng tuần

---

## 🐛 Troubleshooting

**Không thấy node Google Sheets?**
```cmd
cd c:\Users\baold\Desktop\my-workflow-platform\apps\frontend
npm run build
npm run dev
```

**Error: "The caller does not have permission"**
→ Sheet chưa share hoặc chỉ Viewer (cần Editor cho APPEND)

**Error: "Invalid credentials"**
→ Check `.env` có `GOOGLE_API_KEY=...` chưa?

**Gemini không trả về JSON?**
→ Thêm vào System Prompt: "CHỈ trả về JSON thuần, KHÔNG giải thích"

**Bot không reply?**
→ Check terminal worker có log không? Check webhook đã set đúng chưa?

---

## ✅ Checklist

- [ ] Google Sheets created với header A-F
- [ ] Sheet shared "Anyone with the link" → Editor  
- [ ] Spreadsheet ID copied
- [ ] 3 services đang chạy (worker, backend, frontend)
- [ ] Workflow có đủ 8 nodes (1 webhook, 1 groq, 2 filters, 1 sheets, 3 telegrams)
- [ ] Tất cả nodes đã config và kết nối đúng
- [ ] Workflow saved và deployed
- [ ] Webhook URL set vào Telegram
- [ ] Test chat bình thường → Bot trả lời
- [ ] Test 7 tin nhắn → Bot hỏi đánh giá
- [ ] Test positive feedback → Bot cảm ơn + lưu Sheets
- [ ] Test negative feedback → Bot xin lỗi + lưu Sheets
- [ ] Data xuất hiện trong Google Sheets

---

## 🎯 Tóm tắt workflow này làm gì

**1 WORKFLOW duy nhất xử lý TẤT CẢ:**
- ✅ Chat bình thường: Gemini trả lời
- ✅ Đếm tin nhắn tự động: Sau 7 tin nhắn → Hỏi đánh giá
- ✅ Nhận feedback: Phân tích sentiment
- ✅ Lưu Google Sheets: Tự động ghi nhận
- ✅ Reply phù hợp: Negative = xin lỗi, Positive = cảm ơn

**CHỈ CẦN:**
- 1 webhook Telegram
- 1 ⚡ Groq AI với System Prompt thông minh (MIỄN PHÍ)
- 2 Content Filters để phân luồng
- 1 Google Sheets để lưu data
- 3 Telegram nodes để reply

---

**🎉 Hoàn thành! Bạn vừa tạo hệ thống Customer Feedback hoàn chỉnh với AI!**

Truy cập: https://platform.openai.com/account/billing

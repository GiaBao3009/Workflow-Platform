# 📚 Hướng Dẫn Chi Tiết Cấu Hình Các Node Workflow

## 📖 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Webhook Triggers](#webhook-triggers)
3. [AI Nodes](#ai-nodes)
4. [Action Nodes](#action-nodes)
5. [Logic Nodes](#logic-nodes)
6. [Integration Nodes](#integration-nodes)
7. [Kết Nối Nodes](#kết-nối-nodes)
8. [Biến & Template Variables](#biến--template-variables)
9. [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

### Workflow Structure
```
[Webhook] → [AI Processing] → [Logic] → [Action] → [Response]
```

### Node Categories
- **Triggers**: Webhook (Telegram, HTTP)
- **AI**: ChatGPT, Gemini AI, Groq AI
- **Actions**: Telegram, Email, HTTP Request, Database
- **Logic**: Conditional, Content Filter, Delay
- **Integration**: Google Sheets

---

## 🔔 Webhook Triggers

### Telegram Webhook
**Icon**: 📨 | **Type**: `webhook`

#### Cấu Hình:
```yaml
Webhook Path: /webhook/telegram
Method: POST
Content-Type: application/json
```

#### Output Variables:
```javascript
{{webhook.message.text}}           // Nội dung tin nhắn
{{webhook.message.chat.id}}        // Chat ID (dùng cho reply)
{{webhook.message.from.id}}        // User ID người gửi
{{webhook.message.from.username}}  // Username
{{webhook.message.from.first_name}} // Tên
{{webhook.message.message_id}}     // ID tin nhắn
{{webhook.timestamp}}              // Thời gian nhận
```

#### Ví Dụ Telegram Webhook Payload:
```json
{
  "message": {
    "message_id": 123,
    "text": "Xin chào bot",
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "from": {
      "id": 987654321,
      "username": "john_doe",
      "first_name": "John"
    }
  }
}
```

---

## 🤖 AI Nodes

### 1. ⚡ Groq AI (MIỄN PHÍ & NHANH NHẤT)

**Icon**: ⚡ | **Type**: `groq`

#### Ưu Điểm:
- ✅ **MIỄN PHÍ**: 14,400 requests/day
- ✅ **CỰC NHANH**: Inference < 1 giây
- ✅ **30 RPM**: Rate limit cao
- ✅ **Conversation History**: Nhớ lịch sử chat

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Model** | ✅ | Mô hình AI | `llama-3.3-70b` |
| **System Prompt** | ❌ | Vai trò AI | `Bạn là trợ lý AI thân thiện` |
| **User Message** | ✅ | Tin nhắn cần xử lý | `{{webhook.message.text}}` |
| **Max Tokens** | ❌ | Giới hạn độ dài | `2048` (default) |
| **Temperature** | ❌ | Độ sáng tạo | `0.7` (0-2) |
| **Conversation History** | ❌ | Nhớ lịch sử | ☑️ Enabled |
| **Chat ID** | ⚠️ | ID cuộc hội thoại | `{{webhook.message.chat.id}}` |

#### Models Available:
```yaml
llama-3.3-70b:    # 70B parameters, NHANH NHẤT, free
mixtral-8x7b:     # 8x7B MoE, nhanh
gemma2-9b-it:     # 9B parameters, nhẹ
```

#### Output Variables:
```javascript
{{groq-1234567890.response}}    // Phản hồi từ AI
{{groq-1234567890.model}}       // Model đã dùng
{{groq-1234567890.tokens}}      // Số tokens đã dùng
```

#### Ví Dụ Cấu Hình:
```yaml
# Chatbot với memory
Model: llama-3.3-70b
System Prompt: |
  Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.
  Luôn lịch sự, thân thiện và hữu ích.
  
User Message: {{webhook.message.text}}
Temperature: 0.7
Conversation History: ✅ Enabled
Chat ID: {{webhook.message.chat.id}}
```

#### Use Cases:
```yaml
Customer Support:
  - Q&A tự động
  - Nhớ ngữ cảnh khách hàng
  - Giải đáp nhanh chóng

Content Creation:
  - Viết caption
  - Tóm tắt nội dung
  - Dịch thuật

Data Processing:
  - Phân tích sentiment
  - Trích xuất thông tin
  - Format data
```

---

### 2. 🧠 ChatGPT

**Icon**: 🧠 | **Type**: `chatgpt`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Model** | ✅ | GPT model | `gpt-3.5-turbo` |
| **System Prompt** | ❌ | Hướng dẫn AI | `You are a helpful assistant` |
| **User Message** | ✅ | Prompt | `{{webhook.message.text}}` |
| **Max Tokens** | ❌ | Limit | `2000` |
| **Temperature** | ❌ | Creativity | `0.7` |

#### Models:
```yaml
gpt-3.5-turbo:  # Rẻ, nhanh
gpt-4:          # Thông minh, đắt
gpt-4-turbo:    # Cân bằng
```

#### Output Variables:
```javascript
{{chatgpt-123.response}}
{{chatgpt-123.model}}
{{chatgpt-123.tokens}}
```

#### ⚠️ Lưu Ý:
- Tốn phí theo token usage
- Cần API key OpenAI
- Không có free tier

---

### 3. 💎 Gemini AI

**Icon**: 💎 | **Type**: `gemini`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Model** | ✅ | Gemini model | `gemini-pro` |
| **System Prompt** | ❌ | Instructions | `You are an expert` |
| **User Message** | ✅ | Input | `{{webhook.message.text}}` |
| **Max Tokens** | ❌ | Limit | `2048` |
| **Temperature** | ❌ | Randomness | `0.7` |

#### Models:
```yaml
gemini-pro:        # Text only
gemini-pro-vision: # Text + Image
```

#### Output Variables:
```javascript
{{gemini-123.response}}
{{gemini-123.model}}
{{gemini-123.tokens}}
```

---

## 📤 Action Nodes

### 1. 💬 Telegram Response

**Icon**: 💬 | **Type**: `telegram`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Chat ID** | ✅ | Người nhận | `{{webhook.message.chat.id}}` |
| **Text** | ✅ | Nội dung | `{{groq-123.response}}` |
| **Parse Mode** | ❌ | Format | `Markdown` |
| **Reply To** | ❌ | Reply message | `{{webhook.message.message_id}}` |

#### Parse Modes:
```yaml
Markdown:  # *bold* _italic_ `code`
HTML:      # <b>bold</b> <i>italic</i>
None:      # Plain text
```

#### Output Variables:
```javascript
{{telegram-123.messageId}}     // ID tin nhắn đã gửi
{{telegram-123.success}}       // true/false
```

#### Ví Dụ:
```yaml
# Reply với AI response
Chat ID: {{webhook.message.chat.id}}
Text: {{groq-123.response}}
Parse Mode: Markdown
Reply To: {{webhook.message.message_id}}
```

---

### 2. 🔗 HTTP Request

**Icon**: 🔗 | **Type**: `httpRequest`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Method** | ✅ | HTTP method | `POST` |
| **URL** | ✅ | Endpoint | `https://api.example.com` |
| **Headers** | ❌ | Request headers | `{"Authorization": "Bearer token"}` |
| **Body** | ❌ | Request body | `{"data": "{{groq-123.response}}"}` |

#### Methods:
```yaml
GET:    # Lấy dữ liệu
POST:   # Tạo mới
PUT:    # Cập nhật toàn bộ
PATCH:  # Cập nhật một phần
DELETE: # Xóa
```

#### Output Variables:
```javascript
{{http-123.status}}        // 200, 404, 500...
{{http-123.data}}          // Response body
{{http-123.headers}}       // Response headers
```

---

### 3. 📧 Email

**Icon**: 📧 | **Type**: `email`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **To** | ✅ | Email người nhận | `user@example.com` |
| **Subject** | ✅ | Tiêu đề | `New Message from Bot` |
| **Body** | ✅ | Nội dung | `{{groq-123.response}}` |
| **HTML** | ❌ | Dùng HTML | ☑️ Enabled |

#### Output Variables:
```javascript
{{email-123.messageId}}
{{email-123.success}}
```

---

### 4. 🗄️ Database

**Icon**: 🗄️ | **Type**: `database`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Operation** | ✅ | Loại thao tác | `INSERT` |
| **Table** | ✅ | Tên bảng | `messages` |
| **Query** | ❌ | SQL query | `SELECT * FROM users` |
| **Data** | ⚠️ | Dữ liệu (INSERT) | `{"text": "{{webhook.message.text}}"}` |

#### Operations:
```yaml
SELECT: # Đọc dữ liệu
INSERT: # Thêm mới
UPDATE: # Cập nhật
DELETE: # Xóa
```

#### Output Variables:
```javascript
{{db-123.result}}      // Query result
{{db-123.rowCount}}    // Số rows affected
```

---

## 🔀 Logic Nodes

### 1. 🔍 Content Filter

**Icon**: 🔍 | **Type**: `contentFilter`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Input Text** | ✅ | Text cần lọc | `{{webhook.message.text}}` |
| **Keywords** | ✅ | Từ khóa cấm | `spam, lừa đảo, hack` |
| **Case Sensitive** | ❌ | Phân biệt hoa thường | ❌ Disabled |
| **Rejection Message** | ❌ | Thông báo từ chối | `Nội dung không phù hợp` |

#### Output Variables:
```javascript
{{filter-123.passed}}          // true/false
{{filter-123.matchedKeywords}} // ["spam", "hack"]
```

#### Workflow Branches:
```
[Filter] → PASS → [Groq AI] → [Telegram]
        ↘ REJECT → [Telegram Warning]
```

#### Ví Dụ:
```yaml
Input Text: {{webhook.message.text}}
Keywords: spam, casino, 18+, sex, hack
Rejection Message: ⚠️ Tin nhắn của bạn chứa nội dung không phù hợp
```

---

### 2. ◆ Conditional

**Icon**: ◆ | **Type**: `conditional`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Condition** | ✅ | Biến kiểm tra | `{{webhook.message.text}}` |
| **Operator** | ✅ | Toán tử | `contains` |
| **Value** | ✅ | Giá trị so sánh | `hello` |

#### Operators:
```yaml
equals:        # Bằng
not_equals:    # Khác
contains:      # Chứa
not_contains:  # Không chứa
starts_with:   # Bắt đầu với
ends_with:     # Kết thúc với
greater_than:  # Lớn hơn
less_than:     # Nhỏ hơn
```

#### Output Branches:
```
[Conditional] → TRUE → [Action A]
              ↘ FALSE → [Action B]
```

---

### 3. ⏱️ Delay

**Icon**: ⏱️ | **Type**: `delay`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Duration** | ✅ | Thời gian | `5` |
| **Unit** | ✅ | Đơn vị | `giây` |
| **Note** | ❌ | Ghi chú | `Wait for user` |

#### Units:
```yaml
giây:  # Seconds
phút:  # Minutes
giờ:   # Hours
```

#### Use Cases:
```yaml
Rate Limiting: Delay 1 giây giữa các request
Retry Logic:   Delay 5 giây trước khi retry
User Wait:     Delay 2 giây để user đọc message
```

---

## 🔗 Integration Nodes

### 📊 Google Sheets

**Icon**: 📊 | **Type**: `googleSheets`

#### Cấu Hình:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Spreadsheet ID** | ✅ | ID của sheet | `1BxiMVs0XRA5nFMdKvB...` |
| **Action** | ✅ | Thao tác | `APPEND` |
| **Sheet Name** | ❌ | Tên tab | `Sheet1` |
| **Range** | ✅ | A1 notation | `A1:C10` |
| **Values** | ⚠️ | Dữ liệu (WRITE/APPEND) | `[["{{webhook.timestamp}}", "{{webhook.message.text}}"]]` |

#### Actions:
```yaml
READ:   # Đọc dữ liệu
WRITE:  # Ghi đè
APPEND: # Thêm dòng mới
CLEAR:  # Xóa dữ liệu
```

#### Output Variables:
```javascript
{{sheets-123.values}}        // [[row1], [row2]]
{{sheets-123.rowCount}}      // Số dòng
{{sheets-123.updatedRange}}  // Range đã cập nhật
```

#### Ví Dụ - Log Messages:
```yaml
Action: APPEND
Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdD4dIjWbC1TqMFcXJY9-zK8s
Sheet Name: Messages
Range: A:C
Values: |
  [[
    "{{webhook.timestamp}}",
    "{{webhook.message.from.username}}",
    "{{webhook.message.text}}"
  ]]
```

---

## 🔗 Kết Nối Nodes

### Connection Rules

#### 1. Basic Flow
```
[Input] → [Process] → [Output]
```

#### 2. Branching (Conditional/Filter)
```
[Input] → [Condition] → TRUE → [Action A]
                      ↘ FALSE → [Action B]
```

#### 3. Multiple Outputs
```
[Input] → [AI] → [Telegram]
             ↘ [Database]
             ↘ [Google Sheets]
```

#### 4. Sequential Processing
```
[Webhook] → [Filter] → [Groq AI] → [Translate] → [Telegram]
```

---

## 📝 Biến & Template Variables

### Syntax
```
{{nodeType-nodeId.variableName}}
```

### Examples

#### From Webhook:
```javascript
{{webhook.message.text}}
{{webhook.message.chat.id}}
{{webhook.message.from.username}}
{{webhook.timestamp}}
```

#### From Groq AI:
```javascript
{{groq-1234567890.response}}
{{groq-1234567890.model}}
{{groq-1234567890.tokens}}
```

#### From HTTP:
```javascript
{{http-123.data}}
{{http-123.status}}
```

#### From Google Sheets:
```javascript
{{sheets-123.values}}
{{sheets-123.rowCount}}
```

### Variable Helper (📦 Button)
Khi cấu hình node, click nút **📦** để xem tất cả biến available từ các node trước đó.

---

## 💡 Best Practices

### 1. Telegram Chatbot với Groq AI (RECOMMENDED)

```
[Webhook Telegram]
    ↓
[Content Filter] → REJECT → [Telegram Warning]
    ↓ PASS
[Groq AI]
    - Model: llama-3.3-70b
    - System: Trợ lý AI thân thiện
    - User: {{webhook.message.text}}
    - Conversation History: ✅
    - Chat ID: {{webhook.message.chat.id}}
    ↓
[Telegram Response]
    - Chat ID: {{webhook.message.chat.id}}
    - Text: {{groq-123.response}}
    - Reply To: {{webhook.message.message_id}}
```

**Ưu điểm**:
- ✅ Miễn phí hoàn toàn (Groq)
- ✅ Cực nhanh (< 1s)
- ✅ Nhớ lịch sử chat
- ✅ Lọc spam tự động
- ✅ Reply đúng tin nhắn

---

### 2. Logging System

```
[Webhook]
    ↓
[Groq AI] → [Telegram Response]
    ↓
[Google Sheets APPEND]
    - Timestamp: {{webhook.timestamp}}
    - User: {{webhook.message.from.username}}
    - Message: {{webhook.message.text}}
    - AI Response: {{groq-123.response}}
    - Tokens: {{groq-123.tokens}}
```

**Ưu điểm**:
- 📊 Track tất cả conversations
- 📈 Phân tích usage
- 🔍 Audit trail

---

### 3. Multi-Language Support

```
[Webhook]
    ↓
[Conditional: Language Detection]
    - Condition: {{webhook.message.text}}
    - Operator: starts_with
    ↓
TRUE (starts with "/en") → [Groq AI English]
FALSE → [Groq AI Vietnamese]
    ↓
[Telegram Response]
```

---

### 4. Smart Content Moderation

```
[Webhook]
    ↓
[Content Filter Level 1] → REJECT → [Warning + Ban]
    ↓ PASS
[Groq AI: Sentiment Analysis]
    - System: Analyze if message is toxic (yes/no)
    - User: {{webhook.message.text}}
    ↓
[Conditional: Is Toxic?]
    - TRUE → [Telegram: Friendly Warning]
    - FALSE → [Groq AI: Normal Response]
```

---

### 5. Retry Logic với Error Handling

```
[HTTP Request]
    ↓
[Conditional: Check Status]
    - {{http-123.status}} equals 200
    - TRUE → [Continue]
    - FALSE → [Delay 5s] → [HTTP Retry]
```

---

## 🎨 UI Tips

### Node Colors:
- 🔵 **Blue**: Data Input/Output
- 🟢 **Green**: Success/AI Processing
- 🟡 **Yellow**: Warning/Filter
- 🔴 **Red**: Error/Reject
- 🟣 **Purple**: Logic/Conditional

### Connection Handles:
- **Top**: Input (target)
- **Bottom**: Output (source)
- **Left**: TRUE/PASS branch
- **Right**: FALSE/REJECT branch

---

## 🔧 Troubleshooting

### Node Không Click Được?
```yaml
Problem: Click vào node không mở config panel
Solution: Node type phải có trong onNodeClick array ở WorkflowCanvas.tsx
```

### Biến Không Hiện?
```yaml
Problem: {{variable}} không có dữ liệu
Solution: 
  - Check node đó đã chạy chưa (xem logs)
  - Check node type spelling (groq-123 không phải grop-123)
  - Check node ID chính xác
```

### Telegram Không Reply?
```yaml
Problem: Bot không trả lời
Solution:
  - Check Chat ID: {{webhook.message.chat.id}}
  - Check Telegram token trong .env
  - Check backend logs
```

### Groq API Error?
```yaml
Problem: Groq trả về lỗi
Solution:
  - Check API key trong .env (GROQ_API_KEY)
  - Check rate limit (30 RPM, 14,400/day)
  - Check userMessage không empty
```

---

## 📚 References

### API Docs:
- **Groq**: https://console.groq.com/docs
- **Telegram Bot**: https://core.telegram.org/bots/api
- **Google Sheets**: https://developers.google.com/sheets/api

### Rate Limits:
```yaml
Groq:
  - 14,400 requests/day
  - 30 requests/minute
  - 20,000 tokens/minute

Telegram:
  - 30 messages/second per bot
  - No daily limit
```

---

## 🎯 Quick Start Examples

### Example 1: Simple Echo Bot
```yaml
1. Drag Webhook (Telegram)
2. Drag Telegram Response
3. Connect: Webhook → Telegram
4. Config Telegram:
   - Chat ID: {{webhook.message.chat.id}}
   - Text: You said: {{webhook.message.text}}
5. Save & Test
```

### Example 2: AI Chatbot (Free)
```yaml
1. Webhook (Telegram)
2. Groq AI
   - Model: llama-3.3-70b
   - User: {{webhook.message.text}}
   - Conversation: ✅
   - Chat ID: {{webhook.message.chat.id}}
3. Telegram Response
   - Chat ID: {{webhook.message.chat.id}}
   - Text: {{groq-XXX.response}}
4. Connect: Webhook → Groq → Telegram
5. Save & Deploy
```

### Example 3: Spam Filter Bot
```yaml
1. Webhook (Telegram)
2. Content Filter
   - Input: {{webhook.message.text}}
   - Keywords: spam, ads, casino
3. PASS → Groq AI → Telegram Response
4. REJECT → Telegram Warning
   - Text: ⚠️ Message blocked: spam detected
```

---

**📖 Tài liệu được cập nhật:** 2025-01-11
**🔗 Repository:** my-workflow-platform
**⚡ Latest Feature:** Groq AI Integration (Free & Ultra Fast)

# � NỀN TẢNG WORKFLOW TỰ ĐỘNG HÓA

> **Workflow Platform** - Giải pháp tự động hóa quy trình công việc mạnh mẽ với giao diện kéo-thả trực quan, tương tự n8n

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org/)
[![Temporal](https://img.shields.io/badge/Temporal-1.0-orange)](https://temporal.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)

Video demo(lưu ý chưa demo chức năng sheet):https://drive.google.com/file/d/147TMI39JgVFlPdHz8hmmhowtvwg0tWaH/view?usp=sharing
Link Sheet:https://docs.google.com/spreadsheets/d/1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ/edit?gid=0#gid=0

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#-tổng-quan-dự-án)
2. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
3. [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
4. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
5. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
6. [Cài Đặt Nhanh](#-cài-đặt-nhanh)
7. [Các Node Workflow](#-các-node-workflow)
8. [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
9. [API Documentation](#-api-documentation)
10. [Xử Lý Sự Cố](#-xử-lý-sự-cố)

---

## 🎯 Tổng Quan Dự Án

**Workflow Platform** là nền tảng tự động hóa quy trình công việc hoàn chỉnh, cho phép:

- 🎨 **Thiết kế workflow trực quan** với giao diện kéo-thả (React Flow)
- ⚡ **Thực thi đáng tin cậy** với Temporal orchestration engine
- 🤖 **Tích hợp AI miễn phí** (Groq API - 14,400 requests/ngày)
- 📱 **Bot Telegram thông minh** với conversation history
- 📊 **Tự động lưu feedback** vào Google Sheets với AI scoring
- 🔄 **Điều kiện logic phức tạp** với Content Filter
- 💾 **Lưu trữ đám mây** với MongoDB Atlas
- 🛡️ **Xử lý lỗi tự động** với retry policies

### 🎯 Mục Tiêu
Xây dựng nền tảng tự động hóa công việc tương tự **n8n/Zapier** nhưng:
- ✅ Miễn phí & mã nguồn mở
- ✅ Tích hợp AI miễn phí (Groq)
- ✅ Hỗ trợ tiếng Việt đầy đủ
- ✅ Dễ dàng tùy chỉnh & mở rộng

---

## ✨ Tính Năng Nổi Bật

### 🎨 Workflow Designer
- **Giao diện kéo-thả** trực quan với React Flow
- **15+ loại node** sẵn có (HTTP, AI, Database, Logic, Email...)
- **Variable mapping** với template syntax `{{node.field}}`
- **Real-time validation** cấu hình node
- **Auto-save** khi chỉnh sửa

### 🤖 AI Integration (MIỄN PHÍ)
#### ⚡ Groq AI - Tốc Độ Vượt Trội
- **14,400 requests/ngày** hoàn toàn miễn phí
- **Inference < 1 giây** (nhanh nhất thị trường)
- **Conversation History** - nhớ lịch sử chat
- **3 models mạnh mẽ**:
  - `llama-3.3-70b-versatile` (default, cân bằng)
  - `mixtral-8x7b-32768` (context dài)
  - `gemma2-9b-it` (nhẹ & nhanh)
- **JSON response mode** cho structured output
- **System Prompt tùy chỉnh** cho mọi use case

### 📱 Telegram Bot
- **Webhook tự động** với ngrok integration
- **Conversation history** per user
- **Markdown formatting** cho response đẹp
- **Auto-detect feedback** với AI scoring
- **Reply inline** với message_id

### 📊 Google Sheets Integration
- **Auto-append** feedback vào sheets
- **6 cột dữ liệu**: timestamp, username, chatId, text, sentiment JSON, score JSON
- **Service Account Auth** - không cần OAuth
- **Real-time sync** - không delay

### 🔄 Conditional Logic
- **Content Filter Node** - lọc theo keyword
- **Case-sensitive/insensitive** matching
- **PASS/REJECT routing** - rẽ nhánh workflow
- **Regex support** (sắp có)

### 💾 Database
- **MongoDB Atlas** - cloud database miễn phí 512MB
- **Workflow versioning** - lưu cả ReactFlow data & Temporal config
- **Execution history** - tracking đầy đủ
- **User management** - OAuth2 (Google, GitHub)

### 🛡️ Reliability
- **Temporal orchestration** - guaranteed execution
- **Automatic retries** với exponential backoff
- **Activity timeouts** - tránh treo vô hạn
- **Error handling** - graceful failure
- **Workflow resume** - tiếp tục sau crash

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                         USER LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Port 5174)                                 │
│  - Workflow Designer (React Flow)                           │
│  - Node Config Panel                                        │
│  - Execution Dashboard                                      │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/REST API
             ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Express API (Port 3001)                                    │
│  - /api/workflows (CRUD)                                    │
│  - /webhooks/:id (Telegram, HTTP)                           │
│  - /api/auth (OAuth2)                                       │
└────────────┬────────────────────────────────────────────────┘
             │ Temporal Client
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Temporal Server (Port 7233)                                │
│  - Workflow State Machine                                   │
│  - Event History Store                                      │
│  - Task Queue Management                                    │
└────────────┬────────────────────────────────────────────────┘
             │ Activity Execution
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      WORKER LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Temporal Worker (hello-temporal/)                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Activities:                                           │ │
│  │ - callGroq() - Groq AI                               │ │
│  │ - sendTelegramMessage() - Telegram API               │ │
│  │ - googleSheetsOperation() - Google Sheets            │ │
│  │ - contentFilterOperation() - Logic                   │ │
│  │ - httpRequest() - External APIs                      │ │
│  │ - sendEmail() - SMTP                                 │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Atlas (Cloud)                                      │
│  - workflows collection (design + config)                   │
│  - users collection (auth)                                  │
│  - conversation_history (chat context)                      │
│                                                             │
│  Integrations:                                              │
│  - Groq API (gsk_c8O9gXafIUwaYYeKH2CGWGdyb3FYR...)        │
│  - Telegram Bot API (@baol3009_bot)                        │
│  - Google Sheets API (Service Account)                     │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Luồng Thực Thi Workflow

```
┌──────────┐      ┌──────────┐      ┌───────────┐      ┌────────┐
│ Telegram │─────▶│  Ngrok   │─────▶│  Backend  │─────▶│ Worker │
│   User   │      │  Webhook │      │    API    │      │        │
└──────────┘      └──────────┘      └───────────┘      └────┬───┘
                                                              │
    1. User gửi "9/10 rất tốt"                               │
                                                              ▼
                                                      ┌──────────────┐
                                                      │  Groq AI     │
                                                      │  (JSON mode) │
                                                      └──────┬───────┘
                                                             │
                              {"is_feedback": true,          │
                               "sentiment": "positive",      │
                               "score": 9}                   │
                                                             ▼
                                                      ┌──────────────┐
                                                      │Content Filter│
                                                      │  (REJECT)    │
                                                      └──────┬───────┘
                                                             │
                                                    ┌────────┴────────┐
                                                    │                 │
                                                    ▼                 ▼
                                            ┌──────────────┐  ┌──────────┐
                                            │Google Sheets │  │ Telegram │
                                            │   APPEND     │  │  (Skip)  │
                                            └──────────────┘  └──────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
my-workflow-platform/
├── 📁 apps/
│   ├── 📁 backend-api/              # Express REST API
│   │   ├── src/
│   │   │   ├── index.ts             # Server khởi động
│   │   │   ├── routes/
│   │   │   │   └── workflows.ts     # API endpoints
│   │   │   └── workflow-converter.ts # ReactFlow → Temporal
│   │   ├── .env                     # Config (MongoDB, Temporal)
│   │   └── package.json
│   │
│   └── 📁 frontend/                 # React + React Flow
│       ├── src/
│       │   ├── pages/
│       │   │   └── WorkflowCanvas.tsx   # Workflow designer
│       │   ├── components/
│       │   │   ├── nodes/
│       │   │   │   ├── GroqNode.tsx     # Groq AI node
│       │   │   │   ├── TelegramNode.tsx # Telegram node
│       │   │   │   ├── GoogleSheetsNode.tsx
│       │   │   │   └── ContentFilterNode.tsx
│       │   │   └── NodeConfigPanel.tsx  # Config editor
│       │   └── main.tsx
│       └── package.json
│
├── 📁 hello-temporal/               # Temporal Worker
│   ├── src/
│   │   ├── activities.ts            # 💎 Activity implementations
│   │   │   ├── callGroq()           # Groq AI với conversation
│   │   │   ├── sendTelegramMessage()# Telegram API
│   │   │   ├── googleSheetsOperation()
│   │   │   ├── contentFilterOperation()
│   │   │   ├── httpRequest()
│   │   │   └── sendEmail()
│   │   ├── workflows.ts             # Workflow orchestration
│   │   ├── worker.ts                # Worker khởi động
│   │   └── client.ts                # Temporal client
│   └── package.json
│
├── 📁 packages/
│   ├── database/                    # MongoDB schemas
│   ├── shared-types/                # TypeScript types
│   └── temporal-activities/         # Activity interfaces
│
├── 📄 README.md                     # Bạn đang đọc đây
├── 📄 WORKFLOW_NODES_GUIDE.md       # Hướng dẫn chi tiết nodes
├── 📄 TEST_WORKFLOW.md              # Test scenarios
├── 📄 ARCHITECTURE.md               # Kiến trúc chi tiết
│
├── 🔧 Scripts tiện ích:
│   ├── update-gemini-to-groq.js     # Migration script
│   ├── terminate-all-running.js     # Kill workflows
│   ├── list-workflows.js            # Liệt kê workflows
│   ├── check-mongodb.js             # Test MongoDB connection
│   └── set-telegram-webhook.js      # Setup Telegram webhook
│
└── docker-compose.yml               # Temporal + PostgreSQL
```

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công Nghệ | Phiên Bản | Mục Đích |
|------|-----------|-----------|----------|
| **Frontend** | React | 18.2 | UI Framework |
| | React Flow | 11.10 | Visual workflow designer |
| | Zustand | 4.4 | State management |
| | Axios | 1.6 | HTTP client |
| | Vite | 5.0 | Build tool |
| **Backend** | Node.js | 20+ | Runtime |
| | Express | 4.18 | REST API server |
| | TypeScript | 5.0 | Type safety |
| **Orchestration** | Temporal | 1.0 | Workflow engine |
| | PostgreSQL | 14 | Temporal state store |
| **Database** | MongoDB Atlas | 7.0 | Document database |
| **AI** | Groq API | Latest | LLM inference |
| **Integrations** | Telegram Bot API | Latest | Chat platform |
| | Google Sheets API | v4 | Spreadsheet storage |
| | Nodemailer | Latest | Email sending |
| **DevOps** | Docker | Latest | Containerization |
| | Ngrok | Latest | Webhook tunneling |

---

## 🚀 Cài Đặt Nhanh

### Bước 1: Yêu Cầu Hệ Thống

```bash
✅ Node.js >= 20.0.0
✅ npm >= 9.0.0
✅ Docker Desktop (cho Temporal Server)
✅ MongoDB Atlas account (miễn phí)
✅ Groq API key (miễn phí)
✅ Ngrok (cho webhook testing)
```

### Bước 2: Clone Repository

```bash
git clone https://github.com/your-username/my-workflow-platform.git
cd my-workflow-platform
```

### Bước 3: Cấu Hình MongoDB Atlas

1. **Tạo tài khoản** tại https://www.mongodb.com/cloud/atlas
2. **Tạo cluster miễn phí** (512MB M0)
3. **Tạo Database User**:
   - Username: `workflow_admin`
   - Password: (tạo mật khẩu mạnh)
4. **Whitelist IP**: Thêm `0.0.0.0/0` (cho phép mọi IP)
5. **Lấy Connection String**:
   ```
   mongodb+srv://workflow_admin:<password>@cluster0.xxxxx.mongodb.net/workflow-db
   ```

### Bước 4: Lấy API Keys

#### Groq API (Miễn Phí):
1. Đăng ký tại https://console.groq.com
2. Tạo API key tại Settings → API Keys
3. Copy key: `gsk_xxxxxxxxxxxxx`

#### Telegram Bot:
1. Chat với @BotFather trên Telegram
2. Gửi `/newbot` và làm theo hướng dẫn
3. Lưu **Bot Token**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

#### Google Sheets (Tùy chọn):
1. Tạo Service Account tại Google Cloud Console
2. Enable Google Sheets API
3. Download JSON credentials
4. Share spreadsheet với service account email

### Bước 5: Cấu Hình Environment

Tạo file `.env` trong thư mục `apps/backend-api/`:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://workflow_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/workflow-db?appName=Cluster0

# Temporal
TEMPORAL_ADDRESS=localhost:7233

# Frontend URL
FRONTEND_URL=http://localhost:5174

# Email (SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Workflow Platform

# OAuth (Tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Tạo file `.env` trong thư mục `hello-temporal/`:

```bash
# Groq AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxx

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Google Sheets Service Account JSON
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# MongoDB
MONGODB_URI=mongodb+srv://workflow_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/workflow-db

# Temporal
TEMPORAL_ADDRESS=localhost:7233
```

### Bước 6: Cài Đặt Dependencies

```bash
# Root directory
npm install

# Backend
cd apps/backend-api
npm install

# Frontend
cd ../frontend
npm install

# Worker
cd ../../hello-temporal
npm install
```

### Bước 7: Khởi Động Temporal Server

```bash
# Trong thư mục root
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f temporal

# Temporal UI sẽ chạy tại: http://localhost:8080
```

### Bước 8: Build & Start Services

**Terminal 1 - Backend:**
```bash
cd apps/backend-api
npm start
# Backend API: http://localhost:3001
```

**Terminal 2 - Worker:**
```bash
cd hello-temporal
npm run build
npm run dev
# Worker sẽ kết nối với Temporal
```

**Terminal 3 - Frontend:**
```bash
cd apps/frontend
npm run dev
# Frontend: http://localhost:5174
```

**Terminal 4 - Ngrok (cho Telegram webhook):**
```bash
ngrok http 3001
# Copy HTTPS URL: https://xxxxx.ngrok-free.dev
```

### Bước 9: Setup Telegram Webhook

```bash
# Chạy script setup webhook
node set-telegram-webhook.js

# Hoặc manual:
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://xxxxx.ngrok-free.dev/webhooks/whk_xxxxx"
```

### Bước 10: Test Workflow! 🎉

1. Mở frontend: http://localhost:5174
2. Tạo workflow mới
3. Kéo các node:
   - **Webhook** (Telegram trigger)
   - **Groq AI** (xử lý tin nhắn)
   - **Content Filter** (phân loại feedback)
   - **Google Sheets** (lưu feedback)
   - **Telegram** (reply user)
4. Kết nối các node
5. Cấu hình từng node
6. Lưu & Publish workflow
7. Gửi tin nhắn đến bot Telegram!

---

## 🧩 Các Node Workflow

### 1. ⚡ Groq AI Node
**Type:** `groq`

**Chức năng:** Xử lý ngôn ngữ tự nhiên với AI siêu nhanh

**Config:**
- `model`: `llama-3.3-70b-versatile` (mặc định)
- `systemPrompt`: Vai trò AI
- `userMessage`: Tin nhắn input (hỗ trợ variables)
- `maxTokens`: 2048 (mặc định)
- `temperature`: 0.7 (độ sáng tạo)
- `useConversationHistory`: true (nhớ lịch sử)
- `chatId`: ID cuộc hội thoại (required cho history)

**Output Variables:**
- `{{groq-1.response}}` - Câu trả lời AI
- `{{groq-1.sentiment}}` - Sentiment analysis (nếu có)
- `{{groq-1.score}}` - Điểm đánh giá (nếu có)

**Ví dụ System Prompt:**
```
Bạn là chatbot tư vấn sản phẩm thông minh.

QUY TẮC PHẢN HỒI:
1. NẾU tin nhắn là FEEDBACK (có số điểm 1-10):
   → Trả về JSON:
   {
     "is_feedback": true,
     "sentiment": "positive/negative/neutral",
     "score": <số từ 1-10>
   }

2. NẾU là CÂU HỎI bình thường:
   → Trả lời câu hỏi
   → Trả về: {"is_feedback": false, "response": "câu trả lời"}
```

### 2. 📱 Telegram Node
**Type:** `telegram`

**Chức năng:** Gửi tin nhắn Telegram

**Config:**
- `chatId`: ID người nhận (từ webhook)
- `text`: Nội dung tin nhắn
- `parseMode`: `Markdown` hoặc `HTML`
- `replyToMessageId`: ID tin nhắn cần reply (optional)

**Variables:**
```
{{webhook.message.chat.id}}     - Chat ID người gửi
{{groq-1.response}}              - Response từ AI
```

### 3. 📊 Google Sheets Node
**Type:** `googleSheets`

**Chức năng:** Ghi dữ liệu vào Google Sheets

**Config:**
- `action`: `APPEND` (thêm row mới)
- `spreadsheetId`: ID của spreadsheet
- `sheetName`: Tên sheet (để trống cho sheet đầu tiên)
- `range`: Range cột (VD: `A1:F`)
- `values`: Array 2D chứa data

**Ví dụ Values:**
```javascript
[
  [
    "{{timestamp}}",
    "{{webhook.message.from.first_name}}",
    "{{webhook.message.chat.id}}",
    "{{webhook.message.text}}",
    "{{groq-1.response}}",  // JSON sentiment
    "{{groq-1.response}}"   // JSON score
  ]
]
```

### 4. 🔍 Content Filter Node
**Type:** `contentFilter`

**Chức năng:** Lọc nội dung theo keyword, rẽ nhánh workflow

**Config:**
- `inputText`: Text cần kiểm tra
- `keywords`: Array keywords cần tìm
- `caseSensitive`: true/false
- `rejectionMessage`: Message khi REJECT

**Routing:**
- **PASS**: Không chứa keyword → tiếp tục edge "pass"
- **REJECT**: Chứa keyword → rẽ nhánh edge "reject"

**Ví dụ:**
```yaml
inputText: {{groq-1.response}}
keywords: ["\"is_feedback\": true"]
caseSensitive: false
```

**Logic:**
```
IF response chứa "is_feedback": true
  → REJECT → Lưu vào Google Sheets
ELSE
  → PASS → Gửi Telegram reply
```

### 5. 📧 Email Node
**Type:** `email`

**Chức năng:** Gửi email qua SMTP

**Config:**
- `to`: Email người nhận
- `subject`: Tiêu đề
- `body`: Nội dung email (HTML supported)
- `cc`: CC (optional)
- `bcc`: BCC (optional)

### 6. 🌐 HTTP Request Node
**Type:** `httpRequest`

**Chức năng:** Gọi API bên ngoài

**Config:**
- `url`: API endpoint
- `method`: GET/POST/PUT/DELETE
- `headers`: Request headers (object)
- `body`: Request body (JSON)
- `timeout`: Timeout (ms)

### 7. ⏱️ Delay Node
**Type:** `delay`

**Chức năng:** Dừng workflow trong X giây

**Config:**
- `duration`: Thời gian chờ (giây)

### 8. 🔀 Conditional Node
**Type:** `conditional`

**Chức năng:** Rẽ nhánh theo điều kiện

**Config:**
- `conditions`: Array điều kiện
- `defaultBranch`: Nhánh mặc định

---

## 📖 Hướng Dẫn Sử Dụng

### Tạo Workflow Mới

#### 1. Tạo Telegram Chatbot Workflow

**Use Case:** Bot Telegram tư vấn sản phẩm, tự động lưu feedback

**Các bước:**

```
1. Tạo Workflow
   - Click "New Workflow"
   - Đặt tên: "Telegram Product Bot"

2. Thêm Webhook Trigger
   - Kéo node "Webhook" vào canvas
   - Type: Telegram
   - Lưu lại webhook URL

3. Thêm Groq AI
   - Kéo node "Groq AI"
   - Model: llama-3.3-70b-versatile
   - System Prompt: (như ví dụ trên)
   - User Message: {{webhook.message.text}}
   - Chat ID: {{webhook.message.chat.id}}
   - ✅ Enable Conversation History

4. Thêm Content Filter
   - Kéo node "Content Filter"
   - Input Text: {{groq-1.response}}
   - Keywords: ["\"is_feedback\": true"]
   - Case Sensitive: ❌ No

5a. Nhánh REJECT → Google Sheets
   - Kéo node "Google Sheets"
   - Action: APPEND
   - Spreadsheet ID: (từ URL)
   - Range: A1:F
   - Values: [timestamp, username, chatId, text, sentiment, score]

5b. Nhánh PASS → Telegram Reply
   - Kéo node "Telegram"
   - Chat ID: {{webhook.message.chat.id}}
   - Text: {{groq-1.response}}
   - Parse Mode: Markdown

6. Kết Nối Edges
   - Webhook → Groq AI
   - Groq AI → Content Filter
   - Content Filter (REJECT) → Google Sheets
   - Content Filter (PASS) → Telegram

7. Lưu & Publish
   - Click "Save"
   - Click "Publish"
   - Status: ✅ Published

8. Setup Telegram Webhook
   - Copy webhook URL
   - Chạy: node set-telegram-webhook.js
   - Verify webhook active

9. Test!
   - Gửi "hello" đến bot → nhận reply từ AI
   - Gửi "9/10 rất tốt" → data lưu vào Sheets
```

### Variables & Template Syntax

**Syntax:** `{{nodeId.field}}`

**Ví dụ:**

```yaml
# Webhook variables
{{webhook.message.text}}          # Nội dung tin nhắn
{{webhook.message.chat.id}}       # Chat ID
{{webhook.message.from.id}}       # User ID
{{webhook.timestamp}}             # Thời gian

# Node output variables
{{groq-1.response}}               # Response từ Groq AI
{{http-1.status}}                 # HTTP status code
{{http-1.data}}                   # Response data
{{filter-1.passed}}               # Content Filter result

# Nested fields
{{webhook.message.from.first_name}}
{{http-1.data.user.email}}
```

**Auto-complete:**
- Khi gõ `{{` trong config panel, hệ thống hiện gợi ý
- Chọn node từ dropdown
- Chọn field từ danh sách

---

## 📡 API Documentation

### Workflows API

#### GET /api/workflows
Lấy danh sách workflows

**Response:**
```json
{
  "workflows": [
    {
      "_id": "693ba5dcbb9af2ecdcaa674a",
      "name": "Telegram Product Bot",
      "status": "published",
      "triggerType": "WEBHOOK",
      "createdAt": "2025-12-19T10:00:00Z"
    }
  ]
}
```

#### POST /api/workflows
Tạo workflow mới

**Request:**
```json
{
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...]
}
```

#### PUT /api/workflows/:id
Cập nhật workflow

#### DELETE /api/workflows/:id
Xóa workflow

### Webhook Endpoint

#### POST /webhooks/:webhookId
Trigger workflow qua webhook

**Example:**
```bash
curl -X POST \
  https://your-domain.com/webhooks/whk_123abc \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "text": "Hello bot",
      "chat": {"id": 123456789}
    }
  }'
```

---

## 🐛 Xử Lý Sự Cố

### 1. MongoDB Connection Failed

**Triệu chứng:**
```
Error: MongoServerError: authentication failed
```

**Giải pháp:**
```bash
# Kiểm tra connection string
echo $MONGODB_URI

# Test connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/db-name"

# Kiểm tra:
✅ Username/password đúng
✅ IP được whitelist (0.0.0.0/0)
✅ Database name tồn tại
✅ User có quyền read/write
```

### 2. Temporal Worker Không Kết Nối

**Triệu chứng:**
```
Error: Connection refused to localhost:7233
```

**Giải pháp:**
```bash
# Kiểm tra Temporal server
docker-compose ps

# Nếu không chạy, start lại
docker-compose up -d temporal

# Xem logs
docker-compose logs -f temporal

# Verify kết nối
curl http://localhost:8080
```

### 3. Groq API Error

**Triệu chứng:**
```
Error: 401 Unauthorized - Invalid API key
```

**Giải pháp:**
```bash
# Kiểm tra API key
echo $GROQ_API_KEY

# Test API key
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Tạo key mới nếu cần:
# https://console.groq.com/keys
```

### 4. Telegram Webhook Không Nhận

**Triệu chứng:**
- Gửi tin nhắn bot không reply
- Logs không có request

**Giải pháp:**
```bash
# Kiểm tra webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Output nên có:
{
  "url": "https://xxxxx.ngrok-free.dev/webhooks/...",
  "has_custom_certificate": false,
  "pending_update_count": 0
}

# Nếu URL sai hoặc empty:
# 1. Restart ngrok → lấy URL mới
# 2. Chạy: node set-telegram-webhook.js
# 3. Verify lại
```

### 5. Google Sheets APPEND Error

**Triệu chứng:**
```
Error: Unable to parse range: Sheet1!A1:F
```

**Giải pháp:**
```javascript
// APPEND chỉ chấp nhận column-only format
✅ ĐÚNG: range = "A:F"
❌ SAI:  range = "A1:F"
❌ SAI:  range = "Sheet1!A:F"

// Trong node config:
{
  "action": "APPEND",
  "sheetName": "",      // ← Để trống!
  "range": "A:F"        // ← Column-only
}
```

### 6. Worker Auto-Stop

**Triệu chứng:**
- Worker chạy rồi tự tắt
- Không có error

**Giải pháp:**
```
ĐÂY LÀ HÀNH VI BÌNH THƯỜNG!

Temporal Worker chỉ chạy khi:
✅ Có workflow đang thực thi
✅ Có activity cần xử lý

Sau khi workflow hoàn thành → Worker idle → exit

Giải pháp: Không cần làm gì, hệ thống tự restart khi có workflow mới
```

### 7. Variables Không Resolve

**Triệu chứng:**
- Text hiện literal: `{{webhook.message.text}}`
- Không replace thành giá trị thực

**Giải pháp:**
```javascript
// Kiểm tra node có kết nối đúng không
✅ Webhook phải chạy TRƯỚC node dùng {{webhook...}}
✅ Groq AI phải chạy TRƯỚC node dùng {{groq-1...}}

// Kiểm tra syntax
✅ ĐÚNG: {{webhook.message.text}}
❌ SAI:  {webhook.message.text}
❌ SAI:  {{webhook message text}}
❌ SAI:  {{ webhook.message.text }} // có space

// Kiểm tra field tồn tại
// Trong logs worker tìm:
[Workflow] Available results: ['webhook', 'groq-1', ...]
```

---

## 📈 Performance & Best Practices

### Database Indexes
```javascript
// MongoDB indexes để optimize queries
db.workflows.createIndex({ userId: 1, createdAt: -1 });
db.workflows.createIndex({ status: 1 });
db.workflows.createIndex({ webhookUrl: 1 }, { unique: true, sparse: true });
db.conversation_history.createIndex({ chatId: 1, timestamp: -1 });
```

### Retry Policies
```yaml
# Temporal activity retry config
maxAttempts: 3
initialInterval: 1s
backoffMultiplier: 2.0
maxInterval: 10s
```

### Rate Limiting
```yaml
# Groq API limits
Requests: 14,400/day (600/hour)
RPM: 30
TPM: 20,000

# Telegram Bot API limits
Messages: 30/second per bot
```

---

## 🎓 Tài Liệu Tham Khảo

### Docs Đi Kèm
1. **WORKFLOW_NODES_GUIDE.md** - Hướng dẫn chi tiết từng node
2. **TEST_WORKFLOW.md** - Test scenarios & examples
3. **ARCHITECTURE.md** - Kiến trúc hệ thống sâu
4. **GOOGLE_SHEETS_SETUP.md** - Setup Google Sheets API

### External Resources
- [Temporal Documentation](https://docs.temporal.io/)
- [React Flow Docs](https://reactflow.dev/)
- [Groq API Reference](https://console.groq.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

## 🚀 Roadmap

### Phase 1: Core Platform ✅
- [x] Workflow designer với React Flow
- [x] Temporal orchestration
- [x] MongoDB persistence
- [x] Basic nodes (HTTP, Email, Database)

### Phase 2: AI Integration ✅
- [x] Groq API integration
- [x] Conversation history
- [x] JSON response mode
- [x] Auto-scoring feedback

### Phase 3: Integrations ✅
- [x] Telegram Bot
- [x] Google Sheets
- [x] Content Filter
- [x] Webhook triggers

### Phase 4: Advanced Features 🔄 (In Progress)
- [ ] Loop constructs
- [ ] Error handling branches
- [ ] Parallel execution
- [ ] Scheduled workflows (CRON)
- [ ] Custom JavaScript code node

### Phase 5: Production 🔜 (Planned)
- [ ] User authentication (JWT)
- [ ] Multi-tenancy
- [ ] Workflow templates marketplace
- [ ] Monitoring & alerting
- [ ] Performance analytics

---

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 License

Dự án này được phân phối dưới MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## ✨ Tính Năng Độc Đáo

### So Với n8n/Zapier:

| Tính Năng | Workflow Platform | n8n | Zapier |
|-----------|------------------|-----|--------|
| **Giá** | ✅ Miễn phí hoàn toàn | ⚠️ Self-host free, Cloud $20/tháng | ❌ $19.99+/tháng |
| **AI miễn phí** | ✅ Groq (14.4K req/day) | ❌ Cần API key riêng | ❌ Premium add-on |
| **Temporal** | ✅ Guaranteed execution | ❌ Không | ❌ Không |
| **Tiếng Việt** | ✅ Full support | ⚠️ Một phần | ❌ Không |
| **Self-hosted** | ✅ Dễ dàng | ✅ Có | ❌ Không |
| **Open Source** | ✅ Có | ✅ Có | ❌ Không |

---

## 📞 Liên Hệ & Hỗ Trợ

- **Email:** your-email@example.com
- **GitHub Issues:** [Create Issue](https://github.com/your-username/my-workflow-platform/issues)
- **Documentation:** [Wiki](https://github.com/your-username/my-workflow-platform/wiki)

---

## 🎉 Kết Luận

Bạn đã có trong tay một **nền tảng workflow automation hoàn chỉnh** với:
- ✅ Giao diện trực quan dễ sử dụng
- ✅ AI processing siêu nhanh & miễn phí
- ✅ Tích hợp Telegram, Google Sheets
- ✅ Xử lý logic phức tạp với filters
- ✅ Reliable execution với Temporal
- ✅ Dễ dàng mở rộng & tùy chỉnh

**Hãy bắt đầu tạo workflow đầu tiên của bạn ngay hôm nay!** 🚀

---

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 12/2025  
**Tác giả:** Baoldz3009

**⭐ Nếu thấy hữu ích, hãy cho repo một ngôi sao nhé!**

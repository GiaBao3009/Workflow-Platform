# 📘 TEMPORAL WORKER - GIẢI THÍCH CHI TIẾT CODE

> **Mục đích file này:** Giúp bạn hiểu rõ cách Temporal Worker hoạt động, Activities implementation, Workflow orchestration, và distributed systems concepts.

---

## 📁 Cấu Trúc Thư Mục Worker

```
hello-temporal/
├── src/
│   ├── worker.ts                # 🔨 Worker khởi động & polling
│   ├── workflows.ts             # 🎯 Workflow orchestration logic
│   ├── activities.ts            # ⚡ Activity implementations (1235 lines)
│   └── client.ts                # 📞 Temporal client (testing)
├── dist/                        # 📦 Compiled JavaScript
├── .env                         # 🔑 Environment variables
├── package.json
└── tsconfig.json
```

---

## 🎯 Temporal Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TEMPORAL ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Backend API (Express)                                      │
│      │                                                      │
│      │ temporalClient.workflow.start()                     │
│      ▼                                                      │
│  ┌─────────────────────────────────────────────┐          │
│  │         TEMPORAL SERVER (Port 7233)         │          │
│  │  - Workflow State Machine                   │          │
│  │  - Event History Store (PostgreSQL)         │          │
│  │  - Task Queue Management                    │          │
│  └──────────────────┬──────────────────────────┘          │
│                     │                                       │
│                     │ Task Distribution                     │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────┐          │
│  │      TEMPORAL WORKER (hello-temporal/)      │          │
│  │  ┌──────────────────────────────────────┐  │          │
│  │  │  Workflow Functions (workflows.ts)   │  │          │
│  │  │  - executeWorkflow()                 │  │          │
│  │  │  - Orchestration logic               │  │          │
│  │  │  - Activity sequencing               │  │          │
│  │  └──────────────┬───────────────────────┘  │          │
│  │                 │                           │          │
│  │                 │ proxyActivities()         │          │
│  │                 ▼                           │          │
│  │  ┌──────────────────────────────────────┐  │          │
│  │  │  Activity Functions (activities.ts)  │  │          │
│  │  │  - callGroq()                        │  │          │
│  │  │  - sendTelegramMessage()             │  │          │
│  │  │  - googleSheetsOperation()           │  │          │
│  │  │  - filterContent()                   │  │          │
│  │  │  - executeHttpRequestActivity()      │  │          │
│  │  └──────────────┬───────────────────────┘  │          │
│  │                 │                           │          │
│  │                 │ External API Calls        │          │
│  │                 ▼                           │          │
│  └─────────────────────────────────────────────┘          │
│                                                             │
│  External Services:                                        │
│  - Groq API (LLM inference)                               │
│  - Telegram Bot API                                        │
│  - Google Sheets API                                       │
│  - MongoDB (conversation history)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔨 File 1: `worker.ts` - Worker Initialization

### 📌 Worker Setup

```typescript
import { Worker } from '@temporalio/worker'
import * as activities from './activities'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function run() {
  console.log('🔨 Starting Temporal Worker...')
  console.log(`📍 Connecting to: ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`)
  
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'workflow-task-queue',
  })

  console.log('✅ Worker started successfully')
  console.log('⏳ Polling for tasks...')
  
  await worker.run()
}

run().catch((err) => {
  console.error('❌ Worker failed:', err)
  process.exit(1)
})
```

---

### 🎯 1.1 Worker.create() Options

```typescript
const worker = await Worker.create({
  workflowsPath: require.resolve('./workflows'),
  activities,
  taskQueue: 'workflow-task-queue',
})
```

**Phân tích từng option:**

#### workflowsPath
```typescript
workflowsPath: require.resolve('./workflows')
```

**Tại sao cần require.resolve()?**
- Worker cần **absolute path** đến file workflows.js (compiled)
- `require.resolve()` trả về full path: `/path/to/hello-temporal/dist/workflows.js`

**Workflow isolation:**
- Temporal chạy workflows trong **isolated V8 context**
- Không share memory với activities
- Mục đích: Deterministic execution (replay workflows từ history)

**Determinism là gì?**
```typescript
// ❌ NON-DETERMINISTIC workflow (SAI!)
export async function myWorkflow() {
  const random = Math.random()  // Khác nhau mỗi lần replay!
  const now = new Date()         // Khác nhau mỗi lần replay!
  
  if (random > 0.5) {
    await callActivity()
  }
}

// ✅ DETERMINISTIC workflow (ĐÚNG!)
export async function myWorkflow() {
  const result = await callActivity()  // Activity có thể non-deterministic
  
  if (result.value > 0.5) {
    await callAnotherActivity()
  }
}
```

**Tại sao cần determinism?**
- Temporal replay workflows từ event history
- Ví dụ: Worker crash → restart → replay workflow từ đầu
- Nếu workflow non-deterministic → kết quả khác nhau mỗi lần → BUG!

#### activities
```typescript
activities: {
  callGroq,
  sendTelegramMessage,
  googleSheetsOperation,
  filterContent,
  // ... all activity functions
}
```

**Activities CÓ THỂ non-deterministic:**
- Gọi external APIs
- Random numbers
- Current time
- File I/O
- Database queries

**Temporal guarantee:**
- Activity result được lưu vào history
- Replay → lấy result từ history (không gọi lại activity)

#### taskQueue
```typescript
taskQueue: 'workflow-task-queue'
```

**Task Queue pattern:**
```
Backend API                  Temporal Server               Workers
     │                             │                          │
     │─── Start workflow ──────────│                          │
     │                             │                          │
     │                             │──── Push task ──────────│
     │                             │      to queue           │
     │                             │                          │
     │◄──── Workflow ID ───────────│                          │
     │                             │                          │
     │                             │                          │
     │                             │◄─── Poll queue ─────────│
     │                             │                          │
     │                             │──── Assign task ────────│
     │                             │                          │
     │                             │                          │
     │                             │◄─── Activity result ────│
```

**Multiple workers:**
- Worker 1, 2, 3 cùng poll queue "workflow-task-queue"
- Temporal distribute tasks round-robin
- Load balancing tự động
- Horizontal scaling dễ dàng

---

### 🏃 1.2 Worker.run() - Event Loop

```typescript
await worker.run()
```

**Worker lifecycle:**
```typescript
1. Worker.create() → Initialize connection
2. worker.run() → Start polling loop
   │
   ├─→ Poll Temporal Server
   │     ↓
   ├─→ Receive task (workflow or activity)
   │     ↓
   ├─→ Execute task
   │     ↓
   ├─→ Send result back to Temporal
   │     ↓
   └─→ Repeat (infinite loop)
```

**Graceful shutdown:**
```typescript
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down worker...')
  await worker.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down worker...')
  await worker.shutdown()
  process.exit(0)
})
```

**Shutdown flow:**
1. Receive SIGTERM/SIGINT
2. Stop polling for new tasks
3. Wait for running activities to complete
4. Close connections
5. Exit process

---

## 🎯 File 2: `workflows.ts` - Orchestration Logic

### 📌 Workflow Definition

```typescript
import { proxyActivities } from '@temporalio/workflow'
import type * as activities from './activities'

// Proxy activities với timeout & retry config
const {
  executeHttpRequestActivity,
  executeDatabaseActivity,
  sendEmailActivity,
  delayActivity,
  conditionalActivity,
  sendTelegramMessage,
  callGroq,
  filterContent,
  googleSheetsOperation,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 3,
  },
  heartbeatTimeout: '30s',
})

export async function executeWorkflow(
  workflowId: string,
  activities: TemporalActivityConfig[],
  contextData?: Record<string, any>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  
  if (contextData) {
    Object.assign(results, contextData)
  }
  
  console.log(`[Workflow ${workflowId}] Bắt đầu với ${activities.length} activities`)
  
  const sortedActivities = [...activities].sort((a, b) => a.order - b.order)
  
  for (const activity of sortedActivities) {
    // Check condition
    if (activity.condition) {
      const { sourceNode, sourceHandle } = activity.condition
      const sourceResult = results[sourceNode]
      
      if (sourceResult?.passed === false && sourceHandle === 'pass') {
        console.log(`[Workflow] ⏭️ Skipping ${activity.activityName} (condition not met)`)
        continue
      }
      
      if (sourceResult?.passed === true && sourceHandle === 'reject') {
        console.log(`[Workflow] ⏭️ Skipping ${activity.activityName} (condition not met)`)
        continue
      }
    }
    
    // Evaluate templates
    const evaluatedConfig = evaluateConfigTemplates(activity.config, results)
    
    // Execute activity
    const activityFunction = activityMap[activity.activityName]
    const result = await activityFunction(evaluatedConfig, { workflowId, previousResults: results })
    
    results[activity.nodeId] = result
    console.log(`[Workflow] ✅ ${activity.activityName} completed`)
  }
  
  return results
}
```

---

### 🔧 2.1 proxyActivities() - Activity Invocation

```typescript
const { callGroq, sendTelegramMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 3,
  },
})
```

**proxyActivities() là gì?**
- Tạo **proxy functions** cho activities
- Khi gọi `await callGroq(config)` trong workflow:
  1. Temporal serialize config
  2. Gửi task đến task queue
  3. Worker nhận task → execute activity function thật
  4. Activity return result
  5. Result gửi về Temporal Server
  6. Workflow resume với result

**Network boundary:**
```
Workflow (Isolated V8)          Worker Main Thread
       │                                │
       │─── callGroq(config) ──────────│
       │    (proxy call)                │
       │                                │
       │                                │─── Execute activity function
       │                                │    (can call external APIs)
       │                                │
       │◄──── result ───────────────────│
       │                                │
```

---

### ⏱️ 2.2 Timeout & Retry Configuration

#### startToCloseTimeout
```typescript
startToCloseTimeout: '10 minutes'
```

**Ý nghĩa:**
- Activity phải hoàn thành trong 10 phút
- Nếu vượt quá → Temporal cancel & retry
- **Use case:** Tránh activity bị hang vô hạn

**Timeout hierarchy:**
```
scheduleToStartTimeout  - Từ khi schedule đến khi start
startToCloseTimeout     - Từ khi start đến khi complete
scheduleToCloseTimeout  - Từ khi schedule đến khi complete
```

#### Retry Policy
```typescript
retry: {
  initialInterval: '1s',        // Retry đầu tiên sau 1s
  backoffCoefficient: 2,         // Mỗi lần retry tăng gấp đôi
  maximumInterval: '1 minute',   // Max delay giữa retries
  maximumAttempts: 3,            // Max 3 lần retry
}
```

**Exponential backoff timeline:**
```
Attempt 1: Execute
           ↓ (fail)
           Wait 1s
           ↓
Attempt 2: Retry
           ↓ (fail)
           Wait 2s (1s * 2)
           ↓
Attempt 3: Retry
           ↓ (fail)
           Wait 4s (2s * 2, capped at 1 minute)
           ↓
Attempt 4: Retry (final attempt)
           ↓ (fail)
           Workflow fails
```

**Non-retryable errors:**
```typescript
retry: {
  maximumAttempts: 3,
  nonRetryableErrorTypes: [
    'ValidationError',       // Input validation failed
    'AuthenticationError',   // API key invalid
  ],
}
```

**Ví dụ:**
```typescript
// Activity throws ValidationError
throw new Error('ValidationError: Missing required field')
// → Không retry, workflow fail ngay
```

---

### 🔄 2.3 Activity Execution Loop

```typescript
const sortedActivities = [...activities].sort((a, b) => a.order - b.order)

for (const activity of sortedActivities) {
  // 1. Check condition
  if (activity.condition) {
    const { sourceNode, sourceHandle } = activity.condition
    const sourceResult = results[sourceNode]
    
    if (shouldSkip(sourceResult, sourceHandle)) {
      continue
    }
  }
  
  // 2. Evaluate templates
  const evaluatedConfig = evaluateConfigTemplates(activity.config, results)
  
  // 3. Execute activity
  const activityFunction = activityMap[activity.activityName]
  const result = await activityFunction(evaluatedConfig, context)
  
  // 4. Store result
  results[activity.nodeId] = result
}
```

**Phân tích từng bước:**

#### Step 1: Conditional Execution
```typescript
if (activity.condition) {
  const { sourceNode, sourceHandle } = activity.condition
  // sourceNode: 'filter-1'
  // sourceHandle: 'pass' or 'reject'
  
  const sourceResult = results['filter-1']
  // sourceResult: { passed: true/false, ... }
  
  if (sourceResult.passed === false && sourceHandle === 'pass') {
    // Filter REJECT nhưng edge là PASS → skip activity này
    continue
  }
}
```

**Content Filter routing example:**
```
Groq AI → Content Filter ─┬─[PASS]──→ Telegram (activity 2)
                          └─[REJECT]→ Google Sheets (activity 3)

Flow 1 (regular chat):
  Groq returns {"is_feedback": false}
  → Filter PASS
  → Skip activity 3 (Sheets)
  → Execute activity 2 (Telegram)

Flow 2 (feedback):
  Groq returns {"is_feedback": true}
  → Filter REJECT
  → Skip activity 2 (Telegram)
  → Execute activity 3 (Sheets)
```

#### Step 2: Template Evaluation
```typescript
const evaluatedConfig = evaluateConfigTemplates(activity.config, results)
```

**Ví dụ:**
```javascript
// Before evaluation:
{
  chatId: "{{webhook.message.chat.id}}",
  text: "{{groq-1.response}}"
}

// After evaluation (với results):
{
  chatId: "8475393129",
  text: "iPhone 15 có camera 48MP..."
}
```

#### Step 3: Activity Execution
```typescript
const activityFunction = activityMap[activity.activityName]
const result = await activityFunction(evaluatedConfig, context)
```

**activityMap:**
```typescript
const activityMap: Record<string, any> = {
  'callGroq': callGroq,
  'sendTelegramMessage': sendTelegramMessage,
  'googleSheetsOperation': googleSheetsOperation,
  'filterContent': filterContent,
}
```

**Activity invocation flow:**
```typescript
// 1. Workflow calls proxy
await callGroq({ model: 'llama-3.3-70b', ... })

// 2. Temporal schedules activity task
TaskQueue.push({
  activityName: 'callGroq',
  config: { model: '...', ... },
  workflowId: '123',
  attemptCount: 1,
})

// 3. Worker polls & receives task

// 4. Worker executes actual function
async function callGroq(config: GroqConfig) {
  const response = await groqClient.chat.completions.create(...)
  return { response: response.content }
}

// 5. Result sent back to workflow
results['groq-1'] = { response: "..." }
```

---

### 🔍 2.4 Template Variable Resolution

```typescript
function evaluateTemplate(
  template: string,
  previousResults: Record<string, any>
): string {
  const variablePattern = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/g
  
  return template.replace(variablePattern, (match, nodeId, path) => {
    let nodeResult = previousResults[nodeId]
    
    // Prefix matching: "groq-1" → "groq-1766181234567"
    if (!nodeResult) {
      const matchingKey = Object.keys(previousResults).find(key => 
        key.startsWith(nodeId)
      )
      if (matchingKey) {
        nodeResult = previousResults[matchingKey]
      }
    }
    
    if (!nodeResult) {
      return match  // Keep original if not found
    }
    
    // Navigate nested path: "response.data.user.name"
    const pathParts = path.split('.')
    let value = nodeResult
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return match
      }
    }
    
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  })
}
```

**Ví dụ đầy đủ:**
```javascript
// previousResults:
{
  'webhook': {
    message: {
      chat: { id: 8475393129 },
      from: { first_name: 'John' },
      text: 'Hello bot'
    }
  },
  'groq-1766181234567': {
    response: 'Hi John! How can I help?',
    is_feedback: false
  }
}

// Template:
"Chat ID: {{webhook.message.chat.id}}, Response: {{groq-1.response}}"

// Result:
"Chat ID: 8475393129, Response: Hi John! How can I help?"
```

---

## ⚡ File 3: `activities.ts` - Activity Implementations

### 📌 Activity Structure

```typescript
export async function callGroq(
  config: {
    model: string
    systemPrompt: string
    userMessage: string
    chatId?: string
    useConversationHistory?: boolean
    maxTokens?: number
    temperature?: number
  },
  context: ActivityContext
): Promise<any> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  
  // Build conversation history
  const messages: any[] = [
    { role: 'system', content: config.systemPrompt }
  ]
  
  if (config.useConversationHistory && config.chatId) {
    const history = getConversationHistory(config.chatId, 10)
    messages.push(...history)
  }
  
  messages.push({ role: 'user', content: config.userMessage })
  
  // Call Groq API
  const response = await groq.chat.completions.create({
    model: config.model || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: config.maxTokens || 2048,
    temperature: config.temperature || 0.7,
  })
  
  const assistantMessage = response.choices[0]?.message?.content || ''
  
  // Save to conversation history
  if (config.chatId) {
    addToConversationHistory(config.chatId, 'user', config.userMessage)
    addToConversationHistory(config.chatId, 'assistant', assistantMessage)
  }
  
  // Parse JSON response if applicable
  let parsedResponse: any = assistantMessage
  try {
    parsedResponse = JSON.parse(assistantMessage)
  } catch (e) {
    // Not JSON, keep as string
  }
  
  return {
    response: assistantMessage,
    ...parsedResponse,  // Spread JSON fields nếu có
  }
}
```

---

### 🧠 3.1 Groq AI Activity - Deep Dive

#### Conversation History Management
```typescript
const conversationMemory = new Map<string, ConversationMessage[]>()

function getConversationHistory(chatId: string, maxMessages: number = 10): ConversationMessage[] {
  const history = conversationMemory.get(chatId) || []
  return history.slice(-maxMessages)
}

function addToConversationHistory(chatId: string, role: 'user' | 'assistant', content: string): void {
  if (!conversationMemory.has(chatId)) {
    conversationMemory.set(chatId, [])
  }
  
  const history = conversationMemory.get(chatId)!
  history.push({ role, content, timestamp: new Date() })
  
  // Keep only last 50 messages
  if (history.length > 50) {
    history.shift()
  }
}
```

**In-memory storage:**
- **Pros:** Cực nhanh, không cần DB query
- **Cons:** Mất data khi worker restart

**Production alternative:**
```typescript
// Store in MongoDB/Redis
async function getConversationHistory(chatId: string) {
  return await ConversationHistory.find({ chatId })
    .sort({ timestamp: -1 })
    .limit(10)
}

async function addToConversationHistory(chatId: string, role: string, content: string) {
  await ConversationHistory.create({ chatId, role, content, timestamp: new Date() })
}
```

#### Message Building
```typescript
const messages: any[] = [
  { role: 'system', content: config.systemPrompt }
]

// Add conversation history
if (config.useConversationHistory && config.chatId) {
  const history = getConversationHistory(config.chatId, 10)
  messages.push(...history)
}

// Add current user message
messages.push({ role: 'user', content: config.userMessage })
```

**Messages array example:**
```javascript
[
  { role: 'system', content: 'Bạn là chatbot thông minh...' },
  { role: 'user', content: 'iPhone 15 giá bao nhiêu?' },
  { role: 'assistant', content: 'iPhone 15 có giá từ 25 triệu...' },
  { role: 'user', content: 'Có màu gì?' },  // Current message
]
```

**Context window:**
- `llama-3.3-70b-versatile`: 128K tokens
- Average message: ~100 tokens
- 10 messages history: ~1000 tokens
- Plenty of room for long conversations!

#### JSON Response Parsing
```typescript
let parsedResponse: any = assistantMessage
try {
  parsedResponse = JSON.parse(assistantMessage)
} catch (e) {
  // Not JSON, keep as string
}

return {
  response: assistantMessage,  // Raw text
  ...parsedResponse,           // Spread JSON fields
}
```

**JSON mode example:**
```javascript
// System prompt instructs: "Return JSON"
// Assistant response: '{"is_feedback": true, "sentiment": "positive", "score": 9}'

// Parsed result:
{
  response: '{"is_feedback": true, "sentiment": "positive", "score": 9}',
  is_feedback: true,
  sentiment: 'positive',
  score: 9
}

// Usage trong workflow:
const groqResult = await callGroq(...)
if (groqResult.is_feedback) {
  // Execute Google Sheets activity
}
```

---

### 📱 3.2 Telegram Activity

```typescript
export async function sendTelegramMessage(
  config: {
    chatId: string
    text: string
    parseMode?: 'Markdown' | 'HTML'
    replyToMessageId?: number
  },
  context: ActivityContext
): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured')
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  
  try {
    const response = await axios.post(url, {
      chat_id: config.chatId,
      text: config.text,
      parse_mode: config.parseMode || 'Markdown',
      reply_to_message_id: config.replyToMessageId,
    })
    
    console.log(`[Telegram] ✅ Message sent to ${config.chatId}`)
    
    return {
      success: true,
      messageId: response.data.result.message_id,
    }
  } catch (error: any) {
    console.error(`[Telegram] ❌ Failed:`, error.response?.data || error.message)
    throw new Error(`Telegram API error: ${error.message}`)
  }
}
```

**Telegram API endpoint:**
```
POST https://api.telegram.org/bot{token}/sendMessage
```

**Request body:**
```json
{
  "chat_id": "8475393129",
  "text": "Hello from bot!",
  "parse_mode": "Markdown",
  "reply_to_message_id": 456
}
```

**Parse modes:**
- **Markdown:** `*bold* _italic_ [link](url)`
- **HTML:** `<b>bold</b> <i>italic</i> <a href="url">link</a>`

**Response structure:**
```json
{
  "ok": true,
  "result": {
    "message_id": 789,
    "chat": { "id": 8475393129 },
    "date": 1766181234,
    "text": "Hello from bot!"
  }
}
```

---

### 📊 3.3 Google Sheets Activity

```typescript
export async function googleSheetsOperation(
  config: {
    action: 'APPEND' | 'UPDATE' | 'READ'
    spreadsheetId: string
    sheetName?: string
    range: string
    values?: any[][]
  },
  context: ActivityContext
): Promise<any> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured')
  }
  
  const credentials = JSON.parse(serviceAccountJson)
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  
  const sheets = google.sheets({ version: 'v4', auth })
  
  if (config.action === 'APPEND') {
    // CRITICAL FIX: APPEND requires column-only range (no sheet name!)
    let appendRange = config.range || 'A1'
    appendRange = appendRange.replace(/\d+/g, '')  // Remove row numbers: A1:F → A:F
    
    const fullRange = appendRange  // NO sheet name!
    
    console.log(`[Google Sheets] 📋 APPEND to ${config.spreadsheetId}`)
    console.log(`[Google Sheets] 📋 Range: ${fullRange}`)
    console.log(`[Google Sheets] 📋 Values:`, config.values)
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: fullRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: config.values,
      },
    })
    
    console.log(`[Google Sheets] ✅ Appended ${response.data.updates?.updatedRows} rows`)
    
    return {
      success: true,
      updatedRows: response.data.updates?.updatedRows,
      updatedRange: response.data.updates?.updatedRange,
    }
  }
  
  // UPDATE & READ actions...
}
```

**Phân tích chi tiết:**

#### Google Service Account Auth
```typescript
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
```

**Service Account là gì?**
- Bot account không cần user login
- Có email riêng: `workflow-bot@project-id.iam.gserviceaccount.com`
- Share spreadsheet với email này → bot có quyền truy cập

**OAuth vs Service Account:**
```
OAuth (User-based):
✅ Access user's personal spreadsheets
❌ Cần user authorize mỗi lần
❌ Token expire sau 1 giờ
❌ Phức tạp setup

Service Account (Bot-based):
✅ Không cần user authorize
✅ Credentials không expire
✅ Đơn giản setup
❌ Chỉ truy cập spreadsheets được share
```

#### APPEND Range Format
```typescript
// CRITICAL: Google Sheets APPEND API chỉ chấp nhận column-only format!

// ❌ SAI:
range: "Sheet1!A1:F"   // Có sheet name
range: "A1:F"          // Có row numbers

// ✅ ĐÚNG:
range: "A:F"           // Column-only!
```

**Tại sao?**
- APPEND tự động tìm row trống đầu tiên
- Không cần chỉ định row number
- API design choice của Google

**Remove row numbers:**
```typescript
let appendRange = config.range || 'A1'
appendRange = appendRange.replace(/\d+/g, '')  // A1:F → A:F

// Regex \d+:
// \d = digit (0-9)
// + = one or more
// g = global (all occurrences)
```

#### Values Array Structure
```typescript
values: [
  ['2025-12-20T10:30:00Z', 'John', '8475393129', '9/10 rất tốt', '{"sentiment":"positive"}', '{"score":9}']
]
```

**2D array format:**
- Outer array: Rows
- Inner array: Columns

**Ví dụ append 3 rows:**
```typescript
values: [
  ['Row 1 Col A', 'Row 1 Col B', 'Row 1 Col C'],
  ['Row 2 Col A', 'Row 2 Col B', 'Row 2 Col C'],
  ['Row 3 Col A', 'Row 3 Col B', 'Row 3 Col C'],
]
```

**Result trong Sheets:**
```
|   A         |   B         |   C         |
|-------------|-------------|-------------|
| Row 1 Col A | Row 1 Col B | Row 1 Col C |
| Row 2 Col A | Row 2 Col B | Row 2 Col C |
| Row 3 Col A | Row 3 Col B | Row 3 Col C |
```

---

### 🔍 3.4 Content Filter Activity

```typescript
export async function filterContent(
  config: {
    inputText: string
    keywords: string[]
    caseSensitive?: boolean
    rejectionMessage?: string
  },
  context: ActivityContext
): Promise<any> {
  console.log(`[Content Filter] Checking text: "${config.inputText}"`)
  console.log(`[Content Filter] Keywords: ${config.keywords.join(', ')}`)
  
  let textToCheck = config.inputText
  let keywordsToCheck = config.keywords
  
  if (!config.caseSensitive) {
    textToCheck = textToCheck.toLowerCase()
    keywordsToCheck = keywordsToCheck.map(k => k.toLowerCase())
  }
  
  // Check if any keyword matches
  const matchedKeyword = keywordsToCheck.find(keyword => 
    textToCheck.includes(keyword)
  )
  
  if (matchedKeyword) {
    console.log(`[Content Filter] ❌ REJECT - Matched keyword: "${matchedKeyword}"`)
    return {
      passed: false,
      matched: true,
      matchedKeyword,
      message: config.rejectionMessage || 'Content rejected',
    }
  } else {
    console.log(`[Content Filter] ✅ PASS - No keywords matched`)
    return {
      passed: true,
      matched: false,
    }
  }
}
```

**Use case: Feedback detection**
```typescript
// Config:
{
  inputText: '{"is_feedback": true, "score": 9}',
  keywords: ['"is_feedback": true'],
  caseSensitive: false
}

// Result:
{
  passed: false,      // REJECT
  matched: true,
  matchedKeyword: '"is_feedback": true'
}

// Workflow routing:
if (!result.passed) {
  // Execute Google Sheets activity
} else {
  // Execute Telegram activity
}
```

**Case sensitivity:**
```typescript
// Case-insensitive (default):
inputText: "Hello WORLD"
keywords: ["hello"]
→ MATCH ✅

// Case-sensitive:
inputText: "Hello WORLD"
keywords: ["hello"]
caseSensitive: true
→ NO MATCH ❌
```

---

### 🌐 3.5 HTTP Request Activity

```typescript
export async function executeHttpRequestActivity(
  config: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: any
    timeout?: number
  },
  context: ActivityContext
): Promise<any> {
  try {
    console.log(`[HTTP] ${config.method} ${config.url}`)
    
    const response = await axios({
      url: config.url,
      method: config.method,
      headers: config.headers || {},
      data: config.body,
      timeout: config.timeout || 30000,
    })
    
    console.log(`[HTTP] ✅ Status: ${response.status}`)
    
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    }
  } catch (error: any) {
    console.error(`[HTTP] ❌ Failed:`, error.message)
    throw new Error(`HTTP Request failed: ${error.message}`)
  }
}
```

**Variable mapping example:**
```javascript
// Node config:
{
  url: "https://api.example.com/users/{{webhook.userId}}",
  method: "GET",
  headers: {
    "Authorization": "Bearer {{config.apiToken}}"
  }
}

// After template evaluation:
{
  url: "https://api.example.com/users/123",
  method: "GET",
  headers: {
    "Authorization": "Bearer abc123xyz"
  }
}

// Activity result:
{
  status: 200,
  data: {
    id: 123,
    name: "John Doe",
    email: "john@example.com"
  }
}

// Available in next node:
{{httpRequest-1.data.name}}  → "John Doe"
{{httpRequest-1.status}}     → 200
```

---

## 🎓 Advanced Concepts

### 1. Activity Heartbeats

```typescript
export async function longRunningActivity(config: any) {
  for (let i = 0; i < 100; i++) {
    // Do work
    await processChunk(i)
    
    // Send heartbeat
    context.heartbeat({ progress: i })
  }
}
```

**Heartbeat benefits:**
- Temporal knows activity is still running
- Worker crash → Temporal can retry from last heartbeat
- Progress tracking

### 2. Activity Cancellation

```typescript
import { CancellationScope } from '@temporalio/workflow'

export async function cancelableWorkflow() {
  try {
    await CancellationScope.cancellable(async () => {
      await longRunningActivity()
    })
  } catch (err) {
    if (err instanceof CancelledFailure) {
      console.log('Workflow was cancelled')
    }
  }
}
```

### 3. Parallel Activities

```typescript
export async function parallelWorkflow() {
  // Execute activities in parallel
  const [result1, result2, result3] = await Promise.all([
    callGroq({ ... }),
    sendTelegramMessage({ ... }),
    googleSheetsOperation({ ... }),
  ])
  
  return { result1, result2, result3 }
}
```

**Use case:**
- Send notifications đến nhiều channels cùng lúc
- Fetch data từ nhiều APIs
- Process multiple files

### 4. Child Workflows

```typescript
export async function parentWorkflow() {
  const handle = await startChild(childWorkflow, {
    workflowId: 'child-123',
    args: [{ ... }],
  })
  
  const result = await handle.result()
  return result
}
```

**Use case:**
- Decompose complex workflows
- Reuse workflow logic
- Better organization

---

## 📝 Tóm Tắt Kiến Thức

### Temporal Core Concepts

1. **Workflows:**
   - Orchestration logic
   - Deterministic execution
   - Durable state (survives crashes)
   - Replay from history

2. **Activities:**
   - Non-deterministic operations
   - External API calls
   - Retryable with exponential backoff
   - Timeout protection

3. **Task Queues:**
   - Work distribution mechanism
   - Load balancing
   - Multiple workers polling

4. **Worker:**
   - Polls task queue
   - Executes workflows & activities
   - Sends results back

5. **Event History:**
   - All workflow events logged
   - Replay workflows from history
   - Debugging & auditing

### Best Practices

1. **Workflow code:**
   - MUST be deterministic
   - NO external calls
   - NO random/time functions
   - Use activities for side effects

2. **Activity code:**
   - CAN be non-deterministic
   - Handle errors gracefully
   - Use timeouts
   - Make idempotent (safe to retry)

3. **Error handling:**
   - Let activities fail & retry
   - Use non-retryable error types
   - Implement compensation logic

4. **Performance:**
   - Parallel activities when possible
   - Batch operations
   - Cache conversation history

---

**Next Steps:**
- Thực hành: Tạo custom activity
- Đọc Temporal docs: https://docs.temporal.io
- Implement advanced patterns: sagas, distributed transactions

**Questions?**
- Tại sao cần Temporal thay vì queue (RabbitMQ)?
  → Durable execution, automatic retries, workflow state persistence, exactly-once semantics

- Khi nào dùng activities vs child workflows?
  → Activities: Single operations (API calls, DB queries)
  → Child workflows: Complex sub-processes, reusable logic


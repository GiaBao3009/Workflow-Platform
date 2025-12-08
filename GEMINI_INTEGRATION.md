# Hướng dẫn thêm Gemini AI Node

## ✅ Đã hoàn thành:
- [x] Tạo GeminiNode component
- [x] Thêm CSS styling (màu xanh Google #4285f4)

## 🔧 Cần làm tiếp:

### 1. Cập nhật WorkflowCanvas.tsx

Thêm import:
```typescript
import { GeminiNode } from './nodes/CustomNodes';
```

Thêm vào `nodeTypes`:
```typescript
const nodeTypes = {
  httpRequest: HttpRequestNode,
  database: DatabaseNode,
  email: EmailNode,
  delay: DelayNode,
  conditional: ConditionalNode,
  telegram: TelegramNode,
  chatgpt: ChatGPTNode,
  gemini: GeminiNode,  // ← THÊM DÒNG NÀY
  contentFilter: ContentFilterNode,
};
```

Thêm palette item:
```tsx
<div
  className="palette-item"
  draggable
  onDragStart={(event) => onDragStart(event, 'gemini')}
>
  ✨ Gemini AI
</div>
```

Thêm vào `onNodeClick`:
```typescript
const onNodeClick = (event: React.MouseEvent, node: Node) => {
  if ([
    'httpRequest', 'database', 'email', 'delay', 'conditional',
    'telegram', 'chatgpt', 'gemini', 'contentFilter'  // ← THÊM 'gemini'
  ].includes(node.type || '')) {
    // ...
  }
};
```

### 2. Cập nhật NodeConfigPanel.tsx

Thêm case cho Gemini:
```typescript
case 'gemini':
  return (
    <>
      <div className="form-group">
        <label>Model</label>
        <select 
          value={formData.model || 'gemini-pro'}
          onChange={(e) => updateField('model', e.target.value)}
        >
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-pro-vision">Gemini Pro Vision</option>
        </select>
      </div>
      <div className="form-group">
        <label>System Prompt</label>
        <textarea
          placeholder="Bạn là trợ lý AI thân thiện..."
          value={formData.systemPrompt || ''}
          onChange={(e) => updateField('systemPrompt', e.target.value)}
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>User Message *</label>
        <div className="input-with-helper">
          <textarea
            placeholder="Nhập prompt hoặc dùng biến {{webhook.message.text}}"
            value={formData.userMessage || ''}
            onChange={(e) => updateField('userMessage', e.target.value)}
            onFocus={() => setActiveField('userMessage')}
            rows={4}
          />
          {getPreviousNodes().length > 0 && (
            <button 
              type="button"
              className="helper-btn"
              onClick={() => openVariableHelper('userMessage')}
              title="Chèn biến"
            >
              📦
            </button>
          )}
        </div>
        <small className="hint">Tin nhắn từ user: {{webhook.message.text}}</small>
      </div>
      <div className="form-group">
        <label>Max Tokens</label>
        <input
          type="number"
          min="1"
          max="8000"
          value={formData.maxTokens || '2048'}
          onChange={(e) => updateField('maxTokens', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Temperature (0-2)</label>
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={formData.temperature || '0.7'}
          onChange={(e) => updateField('temperature', e.target.value)}
        />
      </div>
      <div className="info-box">
        <strong>💡 Google Gemini API</strong><br/>
        API key được lưu trong biến môi trường. Output: {{gemini-1.response}}
      </div>
    </>
  )
```

Thêm vào `getNodeTitle()`:
```typescript
case 'gemini': return '✨ Gemini AI';
```

Thêm vào `getAvailableVariables()`:
```typescript
case 'gemini':
  return [
    { name: 'response', description: 'AI response text' },
    { name: 'model', description: 'Model used' },
    { name: 'tokens', description: 'Tokens used' },
  ];
```

### 3. Backend - workflow-converter.ts

Thêm case:
```typescript
case 'gemini':
  config = {
    model: data.model || 'gemini-pro',
    systemPrompt: data.systemPrompt || 'Bạn là trợ lý AI thân thiện.',
    userMessage: evaluateTemplate(data.userMessage || '', previousResults),
    maxTokens: parseInt(data.maxTokens || '2048'),
    temperature: parseFloat(data.temperature || '0.7'),
  };
  
  return {
    nodeId: node.id,
    activityName: `GEMINI_${node.id}`,
    nodeType: 'GEMINI',
    order,
    config,
  };
```

Thêm validation:
```typescript
case 'gemini':
  if (!data.userMessage) {
    errors.push(`Gemini node thiếu user message`);
  }
  const geminiMaxTokens = parseInt(data.maxTokens || '2048');
  if (geminiMaxTokens < 1 || geminiMaxTokens > 8000) {
    errors.push(`Gemini node maxTokens phải từ 1-8000`);
  }
  break;
```

### 4. Worker - activities.ts

Thêm activity:
```typescript
export async function callGemini(
  config: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature: number;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured in .env file');
  }
  
  try {
    console.log(`[Gemini Activity] ✨ Calling Google Gemini with model: ${config.model}`);
    console.log(`[Gemini Activity] User message length: ${config.userMessage.length} chars`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${config.systemPrompt}\n\nUser: ${config.userMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      }
    };
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const duration = Date.now() - startTime;
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
    
    console.log(`[Gemini Activity] ✅ Response received (${duration}ms)`);
    console.log(`[Gemini Activity] Response length: ${aiResponse.length} chars, Tokens: ${tokensUsed}`);
    
    return {
      response: aiResponse,
      model: config.model,
      tokens: tokensUsed,
      finishReason: response.data.candidates[0].finishReason,
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Gemini Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      model: config.model,
      errorData: error.response?.data,
    });
    throw new Error(`Gemini call failed: ${error.response?.data?.error?.message || error.message}`);
  }
}
```

### 5. Worker - workflows.ts

Thêm import và proxy:
```typescript
const {
  // ... existing
  sendTelegramMessage,
  callChatGPT,
  callGemini,  // ← THÊM
  filterContent,
} = proxyActivities<typeof activities>({
  // ...
});
```

Thêm case:
```typescript
case 'GEMINI':
  result = await callGemini(evaluatedConfig, {
    workflowId,
    previousResults: results,
  });
  break;
```

### 6. Environment Variable

Thêm vào `.env`:
```env
# ==================== GOOGLE GEMINI API ====================
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

## 📌 Lấy Gemini API Key (MIỄN PHÍ):

1. Truy cập: https://makersuite.google.com/app/apikey
2. Click **"Get API Key"** hoặc **"Create API Key"**
3. Chọn project hoặc tạo mới
4. Copy API key
5. Dán vào `.env`

## 🔄 Rebuild & Restart:

```bash
# Frontend
cd apps/frontend
npm run build

# Backend
cd apps/backend-api
npm run build

# Worker
cd hello-temporal
npm run build

# Restart services
```

## ✨ Gemini API Features:

- **FREE tier:** 60 requests/minute
- **Models:**
  - `gemini-pro`: Text generation
  - `gemini-pro-vision`: Image + Text
- **Max tokens:** 8192 output tokens
- **Response time:** Thường < 2s

## 📝 Test Workflow:

1. Tạo workflow: **Telegram Gemini Bot**
2. Nodes: ContentFilter → Gemini → Telegram
3. Gemini config:
   - Model: `gemini-pro`
   - User Message: `{{webhook.message.text}}`
4. Test ngay!

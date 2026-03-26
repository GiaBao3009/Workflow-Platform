/**
 * Temporal Activities - Các hành động thực tế được gọi
 * Mỗi Activity tương ứng với một loại Node trong React Flow
 */

import axios from 'axios';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { MongoClient, Db, ObjectId } from 'mongodb';
import Groq from 'groq-sdk';

// Load environment variables
// Note: __dirname in dist/activities.js is hello-temporal/dist
// So ../../.env goes to project root
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[Activities] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });
console.log(`[Activities] GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'YES (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NO'}`);
console.log(`[Activities] TELEGRAM_BOT_TOKEN loaded: ${process.env.TELEGRAM_BOT_TOKEN ? 'YES' : 'NO'}`);
console.log(`[Activities] MONGODB_URI loaded: ${process.env.MONGODB_URI ? 'YES' : 'NO'}`);


// ==================== CONVERSATION MEMORY ====================
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const conversationMemory = new Map<string, ConversationMessage[]>();

// Get conversation history
function getConversationHistory(chatId: string, maxMessages: number = 10): ConversationMessage[] {
  const history = conversationMemory.get(chatId) || [];
  return history.slice(-maxMessages); // Return last N messages
}

// Add message to conversation history
function addToConversationHistory(chatId: string, role: 'user' | 'assistant', content: string): void {
  if (!conversationMemory.has(chatId)) {
    conversationMemory.set(chatId, []);
  }
  
  const history = conversationMemory.get(chatId)!;
  history.push({
    role,
    content,
    timestamp: new Date(),
  });
  
  // Keep only last 50 messages to prevent memory issues
  if (history.length > 50) {
    history.shift();
  }
  
  console.log(`[Memory] 💾 Saved ${role} message for chat ${chatId} (${history.length} total)`);
}

// ==================== MESSAGE COUNTER ====================
interface MessageCounter {
  count: number;
  lastReset: string; // Format: YYYY-MM-DD
  surveyAskedToday: boolean;
}

const messageCounters = new Map<string, MessageCounter>();

// Get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// Increment message counter and check if should ask survey
export async function checkSurveyTrigger(
  config: {
    chatId: string;
    threshold?: number; // Default: 7 messages
  },
  context: any
): Promise<{ shouldAskSurvey: boolean; messageCount: number }> {
  const threshold = config.threshold || 7;
  const today = getTodayString();
  const key = config.chatId;

  if (!messageCounters.has(key)) {
    messageCounters.set(key, {
      count: 0,
      lastReset: today,
      surveyAskedToday: false,
    });
  }

  const counter = messageCounters.get(key)!;

  // Reset counter if new day
  if (counter.lastReset !== today) {
    counter.count = 0;
    counter.lastReset = today;
    counter.surveyAskedToday = false;
    console.log(`[Survey] 🔄 Reset counter for chat ${key} (new day: ${today})`);
  }

  // Increment counter
  counter.count++;
  console.log(`[Survey] 📊 Chat ${key}: ${counter.count}/${threshold} messages today`);

  // Check if should ask survey
  const shouldAskSurvey = 
    counter.count >= threshold && 
    !counter.surveyAskedToday;

  if (shouldAskSurvey) {
    counter.surveyAskedToday = true;
    console.log(`[Survey] ✨ Triggering survey for chat ${key} (reached ${threshold} messages)`);
  }

  return {
    shouldAskSurvey,
    messageCount: counter.count,
  };
}

// MongoDB connection (singleton pattern)
let mongoClient: MongoClient | null = null;
let mongodb: Db | null = null;

async function getMongoConnection(): Promise<Db> {
  if (mongodb) {
    return mongodb;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not configured in .env file');
  }

  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongodb = mongoClient.db(process.env.MONGODB_DB_NAME || 'workflow-platform');
    console.log('[MongoDB] ✅ Connected to database');
    return mongodb;
  } catch (error: any) {
    console.error('[MongoDB] ❌ Connection failed:', error.message);
    throw error;
  }
}

interface ActivityContext {
  workflowId: string;
  previousResults?: Record<string, any>;
}

// ==================== HTTP REQUEST ACTIVITY ====================
export async function executeHttpRequestActivity(
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  try {
    console.log(`[HTTP Activity] 🌐 Sending ${config.method} request to ${config.url}`);
    console.log(`[HTTP Activity] Config:`, { headers: config.headers, body: config.body });

    const response = await axios({
      url: config.url,
      method: config.method,
      headers: config.headers || {},
      data: config.body,
      timeout: config.timeout || 30000,
    });

    const duration = Date.now() - startTime;
    console.log(`[HTTP Activity] ✅ Success (${duration}ms), status: ${response.status}`);

    return {
      status: response.status,
      headers: response.headers,
      data: response.data,  // Flat structure - easy to access {{nodeId.data.field}}
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[HTTP Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: config.url,
    });
    throw new Error(`HTTP Request failed: ${error.message}`);
  }
}

// ==================== DATABASE ACTIVITY ====================
export async function executeDatabaseActivity(
  config: {
    operation: 'find' | 'findOne' | 'insertOne' | 'updateOne' | 'deleteOne';
    collection: string;
    filter?: any;
    data?: any;
    options?: any;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  console.log(`[Database Activity] 💾 Executing ${config.operation} on collection: ${config.collection}`);
  console.log(`[Database Activity] Filter:`, config.filter);
  
  try {
    const db = await getMongoConnection();
    const collection = db.collection(config.collection);
    
    let result: any;
    
    switch (config.operation) {
      case 'find':
        // Find multiple documents
        const findResults = await collection.find(config.filter || {}).limit(config.options?.limit || 100).toArray();
        console.log(`[Database Activity] Found ${findResults.length} document(s)`);
        result = {
          operation: 'find',
          collection: config.collection,
          count: findResults.length,
          data: findResults,
        };
        break;
        
      case 'findOne':
        // Find single document
        const findOneResult = await collection.findOne(config.filter || {});
        console.log(`[Database Activity] Found: ${findOneResult ? 'Yes' : 'No'}`);
        result = {
          operation: 'findOne',
          collection: config.collection,
          found: !!findOneResult,
          data: findOneResult || null,
        };
        break;
        
      case 'insertOne':
        // Insert new document
        const insertResult = await collection.insertOne(config.data || {});
        console.log(`[Database Activity] Inserted with ID: ${insertResult.insertedId}`);
        result = {
          operation: 'insertOne',
          collection: config.collection,
          insertedId: insertResult.insertedId.toString(),
          data: { _id: insertResult.insertedId, ...config.data },
        };
        break;
        
      case 'updateOne':
        // Update document
        const updateResult = await collection.updateOne(
          config.filter || {},
          { $set: config.data || {} }
        );
        console.log(`[Database Activity] Modified ${updateResult.modifiedCount} document(s)`);
        result = {
          operation: 'updateOne',
          collection: config.collection,
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          data: config.data,
        };
        break;
        
      case 'deleteOne':
        // Delete document
        const deleteResult = await collection.deleteOne(config.filter || {});
        console.log(`[Database Activity] Deleted ${deleteResult.deletedCount} document(s)`);
        result = {
          operation: 'deleteOne',
          collection: config.collection,
          deletedCount: deleteResult.deletedCount,
        };
        break;
        
      default:
        throw new Error(`Unsupported operation: ${config.operation}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Database Activity] ✅ Success (${duration}ms)`);
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Database Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      collection: config.collection,
      operation: config.operation,
    });
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

// ==================== EMAIL ACTIVITY ====================
export async function sendEmailActivity(
  config: {
    to: string;
    cc?: string;
    subject: string;
    body: string;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  console.log(`[Email Activity] 📧 Sending email to: ${config.to}`);
  console.log(`[Email Activity] Subject: ${config.subject}`);
  
  // Check if SMTP is configured
  const smtpConfigured = process.env.SMTP_HOST && 
                         process.env.SMTP_USER && 
                         process.env.SMTP_PASS;
  
  if (!smtpConfigured) {
    const duration = Date.now() - startTime;
    console.log(`[Email Activity] ⚠️  SMTP not configured, using mock mode (${duration}ms)`);
    return {
      sent: true,
      mock: true,
      to: config.to,
      subject: config.subject,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Workflow Platform'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: config.to,
      cc: config.cc,
      subject: config.subject,
      text: config.body,
      html: config.body.replace(/\n/g, '<br>'),
    });

    const duration = Date.now() - startTime;
    console.log(`[Email Activity] ✅ Email sent successfully (${duration}ms)`);
    console.log(`[Email Activity] Message ID:`, info.messageId);

    return {
      sent: true,
      mock: false,
      to: config.to,
      subject: config.subject,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Email Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      to: config.to,
      smtpHost: process.env.SMTP_HOST,
    });
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

// ==================== DELAY ACTIVITY ====================
export async function delayActivity(
  config: {
    delayMs: number;
    note?: string;
  },
  context: ActivityContext
): Promise<void> {
  console.log(`[Delay Activity] ⏱️  Waiting ${config.delayMs}ms... ${config.note || ''}`);
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, config.delayMs));
  const duration = Date.now() - startTime;
  console.log(`[Delay Activity] ✅ Completed (actual: ${duration}ms)`);
}

// ==================== CONDITIONAL ACTIVITY ====================
export async function conditionalActivity(
  config: {
    field: string;        // Field to check, e.g., "status" or "{{http-1.data.status}}"
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'exists';
    value: string | number | boolean;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  console.log(`[Conditional Activity] 🔍 Checking: ${config.field} ${config.operator} ${config.value}`);
  
  try {
    // Get the actual field value from previousResults if it's a template
    let fieldValue: any = config.field;
    
    // Check if field is a template variable {{nodeId.field}}
    if (typeof config.field === 'string' && config.field.includes('{{')) {
      const variablePattern = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/;
      const match = config.field.match(variablePattern);
      
      if (match && context.previousResults) {
        const [, nodeId, path] = match;
        const nodeResult = context.previousResults[nodeId];
        
        if (nodeResult) {
          const pathParts = path.split('.');
          fieldValue = nodeResult;
          
          for (const part of pathParts) {
            if (fieldValue && typeof fieldValue === 'object' && part in fieldValue) {
              fieldValue = fieldValue[part];
            } else {
              fieldValue = undefined;
              break;
            }
          }
        }
      }
    }
    
    console.log(`[Conditional Activity] Field value: ${JSON.stringify(fieldValue)}`);
    console.log(`[Conditional Activity] Compare with: ${JSON.stringify(config.value)}`);
    
    // Evaluate condition
    let result = false;
    
    switch (config.operator) {
      case '==':
        result = fieldValue == config.value;
        break;
      case '!=':
        result = fieldValue != config.value;
        break;
      case '>':
        result = Number(fieldValue) > Number(config.value);
        break;
      case '<':
        result = Number(fieldValue) < Number(config.value);
        break;
      case '>=':
        result = Number(fieldValue) >= Number(config.value);
        break;
      case '<=':
        result = Number(fieldValue) <= Number(config.value);
        break;
      case 'contains':
        result = String(fieldValue).includes(String(config.value));
        break;
      case 'exists':
        result = fieldValue !== undefined && fieldValue !== null;
        break;
      default:
        throw new Error(`Unsupported operator: ${config.operator}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Conditional Activity] ✅ Result: ${result} (${duration}ms)`);
    
    return {
      condition: `${config.field} ${config.operator} ${config.value}`,
      fieldValue: fieldValue,
      compareValue: config.value,
      result: result,
      branch: result ? 'true' : 'false',
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Conditional Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      field: config.field,
      operator: config.operator,
    });
    throw new Error(`Conditional evaluation failed: ${error.message}`);
  }
}

// ==================== TELEGRAM HELPERS ====================
async function sendTelegramTyping(chatId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    await axios.post(url, {
      chat_id: chatId,
      action: 'typing'
    });
    console.log(`[Telegram] 💬 Typing indicator sent to chat ${chatId}`);
  } catch (error) {
    // Don't throw error, just log - typing indicator is not critical
    console.log(`[Telegram] ⚠️ Failed to send typing indicator:`, error);
  }
}

// ==================== TELEGRAM ACTIVITY ====================
export async function sendTelegramMessage(
  config: {
    chatId: string;
    text: string;
    parseMode?: 'Markdown' | 'HTML' | 'None';
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured in .env file');
  }
  
  try {
    console.log(`[Telegram Activity] ✈️ Sending message to chat ${config.chatId}`);
    console.log(`[Telegram Activity] Text length: ${config.text.length} chars, Parse mode: ${config.parseMode || 'None'}`);
    
    // Try to parse JSON response from Gemini (format: {"is_feedback": false, "response": "text"})
    let messageText = config.text;
    try {
      const parsed = JSON.parse(config.text);
      if (parsed.response) {
        messageText = parsed.response;
        console.log(`[Telegram Activity] 📝 Extracted response from JSON`);
      }
    } catch (e) {
      // Not JSON, use original text
      console.log(`[Telegram Activity] 📝 Using text as-is (not JSON)`);
    }
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: any = {
      chat_id: config.chatId,
      text: messageText,
    };
    
    // Only add parse_mode if not 'None'
    if (config.parseMode && config.parseMode !== 'None') {
      payload.parse_mode = config.parseMode;
    }
    
    const response = await axios.post(url, payload);
    
    const duration = Date.now() - startTime;
    console.log(`[Telegram Activity] ✅ Message sent successfully (${duration}ms)`);
    console.log(`[Telegram Activity] Message ID: ${response.data.result.message_id}`);
    
    return {
      messageId: response.data.result.message_id,
      sent: true,
      chatId: config.chatId,
      timestamp: response.data.result.date,
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Telegram Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      chatId: config.chatId,
      errorData: error.response?.data,
    });
    throw new Error(`Telegram send failed: ${error.response?.data?.description || error.message}`);
  }
}

// ==================== CHATGPT ACTIVITY ====================
export async function callChatGPT(
  config: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature: number;
    chatId?: string; // Optional: for typing indicator
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured in .env file');
  }
  
  try {
    // Send typing indicator if chatId is provided
    if (config.chatId) {
      await sendTelegramTyping(config.chatId);
    }
    
    console.log(`[ChatGPT Activity] 🤖 Calling OpenAI with model: ${config.model}`);
    console.log(`[ChatGPT Activity] User message length: ${config.userMessage.length} chars`);
    console.log(`[ChatGPT Activity] Max tokens: ${config.maxTokens}, Temperature: ${config.temperature}`);
    
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: config.userMessage },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    };
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    const duration = Date.now() - startTime;
    const aiResponse = response.data.choices[0].message.content;
    const tokensUsed = response.data.usage.total_tokens;
    
    console.log(`[ChatGPT Activity] ✅ Response received (${duration}ms)`);
    console.log(`[ChatGPT Activity] Response length: ${aiResponse.length} chars, Tokens: ${tokensUsed}`);
    
    return {
      response: aiResponse,
      model: config.model,
      tokens: tokensUsed,
      finishReason: response.data.choices[0].finish_reason,
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[ChatGPT Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      model: config.model,
      errorData: error.response?.data,
    });
    
    // Fallback: Mock response if quota exceeded (for testing)
    if (error.response?.data?.error?.code === 'insufficient_quota') {
      console.log(`[ChatGPT Activity] 🔄 Using mock response due to quota limit`);
      const mockResponse = `Xin chào! Tôi là trợ lý AI. Bạn vừa hỏi: "${config.userMessage}". Hiện tại OpenAI API đang tạm thời không khả dụng, đây là response mô phỏng để test workflow. Workflow đang hoạt động bình thường!`;
      
      return {
        response: mockResponse,
        model: config.model + ' (mock)',
        tokens: mockResponse.length,
        finishReason: 'mock',
      };
    }
    
    throw new Error(`ChatGPT call failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// ==================== CONTENT FILTER ACTIVITY ====================
export async function filterContent(
  config: {
    inputText: string;
    keywords: string[];
    rejectionMessage: string;
    caseSensitive: boolean;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log(`[Content Filter Activity] 🛡️ Checking text (${config.inputText.length} chars) against ${config.keywords.length} keywords`);
    console.log(`[Content Filter Activity] Case sensitive: ${config.caseSensitive}`);
    
    const text = config.caseSensitive ? config.inputText : config.inputText.toLowerCase();
    const matchedKeywords: string[] = [];
    
    for (const keyword of config.keywords) {
      const k = config.caseSensitive ? keyword : keyword.toLowerCase();
      if (text.includes(k)) {
        matchedKeywords.push(keyword); // Return original keyword
      }
    }
    
    const passed = matchedKeywords.length === 0;
    const duration = Date.now() - startTime;
    
    if (passed) {
      console.log(`[Content Filter Activity] ✅ Content passed filter (${duration}ms)`);
    } else {
      console.log(`[Content Filter Activity] ⚠️ Content blocked (${duration}ms) - matched: ${matchedKeywords.join(', ')}`);
    }
    
    return {
      passed: passed,
      matchedKeywords: matchedKeywords,
      inputText: config.inputText,
      rejectionMessage: passed ? null : config.rejectionMessage,
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Content Filter Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
    });
    throw new Error(`Content filter failed: ${error.message}`);
  }
}

// ==================== GEMINI AI ACTIVITY ====================
export async function callGemini(
  config: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature: number;
    chatId?: string; // Optional: for typing indicator and conversation memory
    useConversationHistory?: boolean; // Enable multi-turn conversation
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured in .env file');
  }
  
  try {
    // Send typing indicator if chatId is provided
    if (config.chatId) {
      await sendTelegramTyping(config.chatId);
      
      // Save user message to conversation history
      if (config.useConversationHistory) {
        addToConversationHistory(config.chatId, 'user', config.userMessage);
      }
    }
    
    console.log(`[Gemini Activity] ✨ Calling Google Gemini with model: ${config.model}`);
    console.log(`[Gemini Activity] User message length: ${config.userMessage.length} chars`);
    console.log(`[Gemini Activity] Max tokens: ${config.maxTokens}, Temperature: ${config.temperature}`);
    
    // Build conversation context if enabled
    let promptText = `${config.systemPrompt}\n\nUser: ${config.userMessage}`;
    
    if (config.chatId && config.useConversationHistory) {
      const history = getConversationHistory(config.chatId, 10);
      if (history.length > 0) {
        console.log(`[Gemini Activity] 💭 Using conversation history (${history.length} messages)`);
        
        // Build context from history
        const contextMessages = history.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
        
        promptText = `${config.systemPrompt}\n\nPrevious conversation:\n${contextMessages}\n\nUser: ${config.userMessage}`;
      }
    }
    
    // Map old model names to new ones (December 2024 models)
    const modelMap: Record<string, string> = {
      'gemini-pro': 'gemini-2.5-flash',
      'gemini-pro-vision': 'gemini-2.5-flash',
      'gemini-1.5-flash': 'gemini-2.5-flash',
      'gemini-1.5-pro': 'gemini-2.5-pro',
    };
    const actualModel = modelMap[config.model] || config.model;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: promptText // Use conversation-aware prompt
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
    
    // Check if response has valid candidates
    if (!response.data.candidates || response.data.candidates.length === 0) {
      console.error(`[Gemini Activity] ❌ No candidates in response:`, JSON.stringify(response.data, null, 2));
      throw new Error(`Gemini returned no candidates. Response: ${JSON.stringify(response.data)}`);
    }
    
    let rawResponse = response.data.candidates[0].content.parts[0].text;
    const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
    
    // ALWAYS extract clean text from response, removing JSON wrappers and markdown
    let aiResponse = rawResponse;
    let isFeedback = false;
    let feedbackData = null;
    
    console.log(`[Gemini Activity] 📝 Raw response preview:`, rawResponse.substring(0, 300));
    
    try {
      // Step 1: Remove ALL markdown code blocks
      let cleanText = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```javascript\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Step 2: Try to extract JSON if present
      const jsonMatch = cleanText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[Gemini Activity] 🎯 Found JSON:`, {
            is_feedback: parsed.is_feedback,
            has_response: !!parsed.response
          });
          
          // If it's a structured response with "response" field, extract it
          if (parsed.is_feedback === true) {
            isFeedback = true;
            feedbackData = parsed;
            aiResponse = `Cảm ơn bạn đã đánh giá! 😊`;
            console.log(`[Gemini Activity] ⭐ Feedback detected`);
          } else if (parsed.response) {
            // Extract ONLY the response text
            aiResponse = parsed.response;
            console.log(`[Gemini Activity] ✅ Extracted response from JSON (${aiResponse.length} chars)`);
          } else {
            // JSON exists but no response field, use text before JSON
            const textBeforeJson = cleanText.substring(0, cleanText.indexOf(jsonMatch[0])).trim();
            if (textBeforeJson) {
              aiResponse = textBeforeJson;
              console.log(`[Gemini Activity] 📄 Using text before JSON (${aiResponse.length} chars)`);
            }
          }
        } catch (parseError) {
          // JSON-like structure but not valid JSON, use cleaned text
          console.log(`[Gemini Activity] ⚠️ Invalid JSON, using cleaned text`);
          aiResponse = cleanText;
        }
      } else {
        // No JSON found, use cleaned text
        aiResponse = cleanText;
        console.log(`[Gemini Activity] 📝 No JSON found, using cleaned text (${aiResponse.length} chars)`);
      }
    } catch (e: any) {
      console.log(`[Gemini Activity] ❌ Error processing response:`, e.message);
      console.log(`[Gemini Activity] Using raw response as fallback`);
      aiResponse = rawResponse;
    }
    
    // Save assistant response to conversation history
    if (config.chatId && config.useConversationHistory) {
      addToConversationHistory(config.chatId, 'assistant', aiResponse);
    }
    
    console.log(`[Gemini Activity] ✅ Response received (${duration}ms)`);
    console.log(`[Gemini Activity] Response length: ${aiResponse.length} chars, Tokens: ${tokensUsed}`);
    
    return {
      response: aiResponse,
      rawResponse: rawResponse,
      isFeedback,
      feedbackData,
      model: config.model,
      tokens: tokensUsed,
      finishReason: response.data.candidates[0].finishReason || 'STOP',
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // LOG FULL ERROR DETAILS
    console.error(`[Gemini Activity] ❌ Failed after ${duration}ms:`);
    console.error(`[Gemini Activity] Error message: ${error.message}`);
    console.error(`[Gemini Activity] Error code: ${error.code}`);
    console.error(`[Gemini Activity] Response status: ${error.response?.status}`);
    console.error(`[Gemini Activity] Response data:`, JSON.stringify(error.response?.data, null, 2));
    console.error(`[Gemini Activity] API Key length: ${apiKey?.length || 0}`);
    console.error(`[Gemini Activity] API Key first 10 chars: ${apiKey?.substring(0, 10)}`);
    console.error(`[Gemini Activity] Model used: ${config.model}`);
    
    throw new Error(`Gemini call failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// ==================== GROQ AI ACTIVITY ====================
export async function callGroq(
  config: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature: number;
    chatId?: string;
    useConversationHistory?: boolean;
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured in .env file');
  }
  
  try {
    // Send typing indicator if chatId is provided
    if (config.chatId) {
      await sendTelegramTyping(config.chatId);
      
      if (config.useConversationHistory) {
        addToConversationHistory(config.chatId, 'user', config.userMessage);
      }
    }
    
    console.log(`[Groq Activity] ⚡ Calling Groq with model: ${config.model}`);
    console.log(`[Groq Activity] User message length: ${config.userMessage.length} chars`);
    
    const groq = new Groq({ apiKey });
    
    // Build messages array
    const messages: any[] = [
      { role: 'system', content: config.systemPrompt }
    ];
    
    // Add conversation history if enabled
    if (config.chatId && config.useConversationHistory) {
      const history = getConversationHistory(config.chatId, 10);
      if (history.length > 0) {
        console.log(`[Groq Activity] 💭 Using conversation history (${history.length} messages)`);
        history.forEach(msg => {
          messages.push({ role: msg.role, content: msg.content });
        });
      }
    }
    
    // Add current user message
    messages.push({ role: 'user', content: config.userMessage });
    
    // Map model names (Groq uses different naming)
    const modelMap: Record<string, string> = {
      'gemini-pro': 'llama-3.3-70b-versatile',
      'gemini-2.5-flash': 'llama-3.3-70b-versatile',
      'llama-3.3-70b': 'llama-3.3-70b-versatile',
      'mixtral-8x7b': 'mixtral-8x7b-32768',
      'gemma-7b': 'gemma2-9b-it',
    };
    const actualModel = modelMap[config.model] || 'llama-3.3-70b-versatile';
    
    // IMPORTANT: Add response_format for JSON output
    const completionParams: any = {
      model: actualModel,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };
    
    // Force JSON response if system prompt mentions JSON
    if (config.systemPrompt.includes('JSON') || config.systemPrompt.includes('json')) {
      completionParams.response_format = { type: 'json_object' };
      console.log('[Groq Activity] 🔧 Forcing JSON response format');
    }
    
    const completion = await groq.chat.completions.create(completionParams);
    
    const duration = Date.now() - startTime;
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('Groq returned no choices');
    }
    
    let rawResponse = completion.choices[0].message.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    // Process response (same logic as Gemini)
    let aiResponse = rawResponse;
    let isFeedback = false;
    let feedbackData = null;
    
    console.log(`[Groq Activity] 📝 Raw response preview:`, rawResponse.substring(0, 300));
    
    try {
      let cleanText = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```javascript\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[Groq Activity] 🎯 Found JSON:`, {
            is_feedback: parsed.is_feedback,
            has_response: !!parsed.response
          });
          
          if (parsed.is_feedback === true) {
            isFeedback = true;
            feedbackData = parsed;
            // KEEP RAW JSON for Filter to match keyword
            aiResponse = rawResponse; // Keep original JSON string
            console.log(`[Groq Activity] ⭐ Feedback detected - keeping JSON for Filter`);
          } else if (parsed.response) {
            aiResponse = parsed.response;
            console.log(`[Groq Activity] ✅ Extracted response from JSON (${aiResponse.length} chars)`);
          } else {
            const textBeforeJson = cleanText.substring(0, cleanText.indexOf(jsonMatch[0])).trim();
            if (textBeforeJson) {
              aiResponse = textBeforeJson;
              console.log(`[Groq Activity] 📝 Using text before JSON (${aiResponse.length} chars)`);
            }
          }
        } catch (e) {
          console.log(`[Groq Activity] ❌ JSON parse failed, using cleaned text`);
          aiResponse = cleanText;
        }
      } else {
        aiResponse = cleanText;
        console.log(`[Groq Activity] 📝 No JSON found, using cleaned text (${aiResponse.length} chars)`);
      }
    } catch (e: any) {
      console.log(`[Groq Activity] ❌ Error processing response:`, e.message);
      aiResponse = rawResponse;
    }
    
    // Save to conversation history
    if (config.chatId && config.useConversationHistory) {
      addToConversationHistory(config.chatId, 'assistant', aiResponse);
    }
    
    console.log(`[Groq Activity] ✅ Response received (${duration}ms - FAST! ⚡)`);
    console.log(`[Groq Activity] Response length: ${aiResponse.length} chars, Tokens: ${tokensUsed}`);
    
    return {
      response: aiResponse,
      rawResponse: rawResponse,
      isFeedback,
      feedbackData,
      model: actualModel,
      tokens: tokensUsed,
      finishReason: completion.choices[0].finish_reason || 'stop',
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`[Groq Activity] ❌ Failed after ${duration}ms:`);
    console.error(`[Groq Activity] Error:`, error.message);
    
    throw new Error(`Groq call failed: ${error.message}`);
  }
}

// ==================== GOOGLE SHEETS ACTIVITY ===================================
export async function googleSheetsOperation(
  config: {
    spreadsheetId: string;
    action: 'READ' | 'WRITE' | 'APPEND' | 'UPDATE' | 'CLEAR';
    sheetName?: string;
    range?: string; // e.g., "A1:B10" or "Sheet1!A1:B10"
    values?: any[][]; // 2D array for write operations
    serviceAccountJson?: string; // JSON string of service account credentials
  },
  context: ActivityContext
): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log(`[Google Sheets Activity] 📊 ${config.action} operation on sheet ${config.spreadsheetId}`);
    
    // Import googleapis
    const { google } = await import('googleapis');
    
    // Setup authentication
    let auth;
    if (config.serviceAccountJson) {
      // Use service account (recommended for production)
      const credentials = JSON.parse(config.serviceAccountJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      // Use API key (limited functionality)
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY or serviceAccountJson required');
      }
      auth = apiKey;
    }
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Build range string
    // For APPEND operation, use sheet name + range (fixed quirk)
    let fullRange;
    if (config.action === 'APPEND') {
      // CRITICAL: Google Sheets APPEND API does NOT accept sheet name prefix
      // Must use ONLY column format: "A:F" not "Sheet1!A:F"
      let appendRange = config.range || 'A1';
      appendRange = appendRange.replace(/\d+/g, ''); // Remove all numbers: A1:F1 → A:F
      
      fullRange = appendRange; // NO sheet name for APPEND!
      console.log(`[Google Sheets Activity] 📋 APPEND mode: Using column-only range WITHOUT sheet name`);
    } else {
      fullRange = config.sheetName 
        ? `${config.sheetName}!${config.range || 'A:Z'}`
        : config.range || 'A:Z';
    }
    
    console.log(`[Google Sheets Activity] 📋 Attempting ${config.action} on:`, {
      spreadsheetId: config.spreadsheetId,
      fullRange,
      sheetName: config.sheetName,
      range: config.range,
    });
    
    let result;
    let retryWithoutSheetName = false;
    
    switch (config.action) {
      case 'READ':
        const readResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: fullRange,
        });
        
        result = {
          values: readResponse.data.values || [],
          rowCount: readResponse.data.values?.length || 0,
          columnCount: readResponse.data.values?.[0]?.length || 0,
        };
        console.log(`[Google Sheets Activity] ✅ Read ${result.rowCount} rows`);
        break;
        
      case 'WRITE':
        if (!config.values || config.values.length === 0) {
          throw new Error('Values required for WRITE operation');
        }
        
        const writeResponse = await sheets.spreadsheets.values.update({
          spreadsheetId: config.spreadsheetId,
          range: fullRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: config.values,
          },
        });
        
        result = {
          updatedCells: writeResponse.data.updatedCells,
          updatedRows: writeResponse.data.updatedRows,
          updatedColumns: writeResponse.data.updatedColumns,
          updatedRange: writeResponse.data.updatedRange,
        };
        console.log(`[Google Sheets Activity] ✅ Wrote ${result.updatedRows} rows`);
        break;
        
      case 'APPEND':
        if (!config.values || config.values.length === 0) {
          throw new Error('Values required for APPEND operation');
        }
        
        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: config.spreadsheetId,
          range: fullRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: config.values,//=======//
          },
        });
        
        result = {
          updatedCells: appendResponse.data.updates?.updatedCells,
          updatedRows: appendResponse.data.updates?.updatedRows,
          updatedRange: appendResponse.data.updates?.updatedRange,
          tableRange: appendResponse.data.tableRange,
        };
        console.log(`[Google Sheets Activity] ✅ Appended ${result.updatedRows} rows`);
        break;
        
      case 'CLEAR':
        const clearResponse = await sheets.spreadsheets.values.clear({
          spreadsheetId: config.spreadsheetId,
          range: fullRange,
        });
        
        result = {
          clearedRange: clearResponse.data.clearedRange,
        };
        console.log(`[Google Sheets Activity] ✅ Cleared range ${result.clearedRange}`);
        break;
        
      default:
        throw new Error(`Unsupported action: ${config.action}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Google Sheets Activity] ⏱️  Completed in ${duration}ms`);
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Google Sheets Activity] ❌ Failed after ${duration}ms:`, {
      message: error.message,
      action: config.action,
      errorData: error.response?.data,
    });
    throw new Error(`Google Sheets ${config.action} failed: ${error.message}`);
  }
}


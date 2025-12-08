/**
 * Workflow Converter - Convert React Flow data to Temporal workflow
 * Chuyển đổi nodes + edges từ React Flow thành Temporal activity sequence
 */

import { Node, Edge } from 'reactflow';

export interface TemporalActivityConfig {
  nodeId: string;
  activityName: string;
  nodeType: string;
  config: any;
  order: number;
  inputs?: Record<string, any>; // Input data from previous nodes
  condition?: { // Điều kiện để chạy activity (từ edge với sourceHandle)
    sourceNode: string;
    sourceHandle: string;
  };
}

/**
 * Evaluate template variables in string
 * Support: {{nodeId.field}}, {{nodeId.field.nested}}
 */
function evaluateTemplate(
  template: string,
  previousResults: Record<string, any>
): string {
  if (!template || typeof template !== 'string') {
    return template;
  }
  
  // Match {{nodeId.field}} or {{nodeId.field.nested.path}}
  const variablePattern = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/g;
  
  return template.replace(variablePattern, (match, nodeId, path) => {
    // Try exact match first
    let nodeResult = previousResults[nodeId];
    
    // If not found, try to find by prefix (e.g., "gemini-1" matches "gemini-1764521667996")
    if (!nodeResult) {
      const matchingKey = Object.keys(previousResults).find(key => key.startsWith(nodeId + '-'));
      if (matchingKey) {
        nodeResult = previousResults[matchingKey];
        console.log(`[Converter] 🔍 Found node by prefix: ${nodeId} -> ${matchingKey}`);
      }
    }
    
    if (!nodeResult) {
      console.warn(`Node result not found: ${nodeId}`);
      return match; // Keep original if not found
    }
    
    // Navigate nested path: result.data.name -> nodeResult.result.data.name
    const pathParts = path.split('.');
    let value = nodeResult;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`Path not found: ${nodeId}.${path}`);
        return match;
      }
    }
    
    // Convert to string
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

/**
 * Evaluate all template variables in config object
 */
function evaluateConfigTemplates(
  config: any,
  previousResults: Record<string, any>
): any {
  if (!config || typeof config !== 'object') {
    return config;
  }
  
  const evaluated: any = Array.isArray(config) ? [] : {};
  
  for (const key in config) {
    const value = config[key];
    
    if (typeof value === 'string') {
      evaluated[key] = evaluateTemplate(value, previousResults);
    } else if (typeof value === 'object' && value !== null) {
      evaluated[key] = evaluateConfigTemplates(value, previousResults);
    } else {
      evaluated[key] = value;
    }
  }
  
  return evaluated;
}

/**
 * Convert React Flow workflow to Temporal activity sequence
 * Now includes previousResults for variable resolution
 */
export function convertWorkflowToTemporal(
  nodes: Node[],
  edges: Edge[],
  previousResults: Record<string, any> = {}
): TemporalActivityConfig[] {
  const activities: TemporalActivityConfig[] = [];
  
  // Nếu có edges, thì follow theo edges (theo thứ tự kết nối)
  // Nếu không có edges, thì chạy tất cả custom nodes theo thứ tự position
  
  if (edges.length > 0) {
    // Follow edges từ start node
    const startNode = nodes.find(n => n.type === 'input');
    if (startNode) {
      const visited = new Set<string>();
      const executionOrder: string[] = [];
      const nodeConditions: Map<string, { sourceNode: string; sourceHandle: string }> = new Map();
      
      function traverse(nodeId: string, inheritedCondition?: { sourceNode: string; sourceHandle: string }) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        executionOrder.push(nodeId);
        
        // Tìm nodes tiếp theo và lưu edge conditions
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          let conditionToPropagate = inheritedCondition;

          // Nếu edge có sourceHandle (ví dụ ContentFilter PASS/REJECT), lưu condition mới
          if (edge.sourceHandle) {
            console.log(`[Converter] 🔀 Edge condition found: ${edge.source} --[${edge.sourceHandle}]--> ${edge.target}`);
            conditionToPropagate = {
              sourceNode: edge.source,
              sourceHandle: edge.sourceHandle,
            };
            nodeConditions.set(edge.target, conditionToPropagate);
          } else {
            // Nếu edge không có sourceHandle nhưng node hiện tại đã có condition thì propagate
            const inherited = nodeConditions.get(nodeId) || inheritedCondition;
            if (inherited && !nodeConditions.has(edge.target)) {
              console.log(`[Converter] 🔁 Propagating condition ${inherited.sourceNode} -> ${inherited.sourceHandle} to ${edge.target}`);
              nodeConditions.set(edge.target, inherited);
              conditionToPropagate = inherited;
            }
          }

          traverse(edge.target, conditionToPropagate);
        });
      }
      
      traverse(startNode.id);
      
      // Convert nodes theo execution order
      let order = 0;
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type === 'input' || node.type === 'output') {
          continue;
        }
        
        const activity = convertNodeToActivity(node, order++, previousResults);
        if (activity) {
          // Thêm condition nếu node này có điều kiện
          const condition = nodeConditions.get(nodeId);
          if (condition) {
            activity.condition = condition;
            console.log(`[Converter] 🔗 Activity ${activity.activityName} has condition: ${condition.sourceNode} -> ${condition.sourceHandle}`);
          }
          activities.push(activity);
        }
      }
    }
  }
  
  // Nếu không có activities nào (không có edges hoặc không connect),
  // thì chạy tất cả custom nodes theo thứ tự position Y
  if (activities.length === 0) {
    const customNodes = nodes.filter(n => 
      n.type !== 'input' && n.type !== 'output' && n.type !== 'default'
    );
    
    // Sort theo position Y (từ trên xuống dưới)
    customNodes.sort((a, b) => a.position.y - b.position.y);
    
    let order = 0;
    for (const node of customNodes) {
      const activity = convertNodeToActivity(node, order++, previousResults);
      if (activity) {
        activities.push(activity);
      }
    }
  }
  
  return activities;
}

/**
 * Convert single node to Temporal activity config
 * Evaluates template variables using previousResults
 */
function convertNodeToActivity(
  node: Node,
  order: number,
  previousResults: Record<string, any> = {}
): TemporalActivityConfig | null {
  const nodeType = node.type;
  const data = node.data;
  
  // Evaluate templates in config
  let config: any;
  
  switch (nodeType) {
    case 'httpRequest':
      config = {
        url: evaluateTemplate(data.url || '', previousResults),
        method: data.method || 'GET',
        headers: data.headers ? JSON.parse(evaluateTemplate(data.headers, previousResults)) : undefined,
        body: data.body ? JSON.parse(evaluateTemplate(data.body, previousResults)) : undefined,
      };
      
      return {
        nodeId: node.id,
        activityName: `HTTP_${node.id}`,
        nodeType: 'HTTP_REQUEST',
        order,
        config,
      };
      
    case 'database':
      // Parse filter and data if they exist
      let filter = undefined;
      let dbData = undefined;
      
      if (data.filter) {
        try {
          filter = JSON.parse(evaluateTemplate(data.filter, previousResults));
        } catch (e) {
          console.warn('Failed to parse database filter:', e);
        }
      }
      
      if (data.data) {
        try {
          dbData = JSON.parse(evaluateTemplate(data.data, previousResults));
        } catch (e) {
          console.warn('Failed to parse database data:', e);
        }
      }
      
      config = {
        operation: data.operation || 'find',
        collection: evaluateTemplate(data.collection || '', previousResults),
        filter: filter,
        data: dbData,
        options: data.options,
      };
      
      return {
        nodeId: node.id,
        activityName: `DB_${node.id}`,
        nodeType: 'DATABASE',
        order,
        config,
      };
      
    case 'email':
      config = {
        to: evaluateTemplate(data.to || '', previousResults),
        cc: data.cc ? evaluateTemplate(data.cc, previousResults) : undefined,
        subject: evaluateTemplate(data.subject || '', previousResults),
        body: evaluateTemplate(data.body || '', previousResults),
      };
      
      return {
        nodeId: node.id,
        activityName: `EMAIL_${node.id}`,
        nodeType: 'EMAIL',
        order,
        config,
      };
      
    case 'delay':
      // Convert unit to milliseconds
      let delayMs = parseInt(data.duration || '0');
      const unit = data.unit || 'giây';
      
      if (unit === 'phút') {
        delayMs *= 60 * 1000;
      } else if (unit === 'giờ') {
        delayMs *= 60 * 60 * 1000;
      } else {
        delayMs *= 1000; // giây
      }
      
      return {
        nodeId: node.id,
        activityName: `DELAY_${node.id}`,
        nodeType: 'DELAY',
        order,
        config: {
          delayMs,
          note: data.note,
        },
      };
      
    case 'conditional':
      config = {
        field: evaluateTemplate(data.field || '', previousResults),
        operator: data.operator || '==',
        value: evaluateTemplate(data.value || '', previousResults),
      };
      
      return {
        nodeId: node.id,
        activityName: `CONDITIONAL_${node.id}`,
        nodeType: 'CONDITIONAL',
        order,
        config,
      };
      
    case 'telegram':
      config = {
        chatId: evaluateTemplate(data.chatId || '', previousResults),
        text: evaluateTemplate(data.text || '', previousResults),
        parseMode: data.parseMode || 'Markdown',
      };
      
      return {
        nodeId: node.id,
        activityName: `TELEGRAM_${node.id}`,
        nodeType: 'TELEGRAM',
        order,
        config,
      };
      
    case 'chatgpt':
      // Extract chatId from webhook data if available
      const chatgptChatId = previousResults?.webhook?.message?.chat?.id || null;
      
      config = {
        model: data.model || 'gpt-3.5-turbo',
        systemPrompt: data.systemPrompt || 'Bạn là trợ lý AI hữu ích.',
        userMessage: evaluateTemplate(data.userMessage || '', previousResults),
        maxTokens: parseInt(data.maxTokens || '500'),
        temperature: parseFloat(data.temperature || '0.7'),
        chatId: chatgptChatId, // Use actual chatId value
        useConversationHistory: true, // Always enable for Telegram bots
      };
      
      return {
        nodeId: node.id,
        activityName: `CHATGPT_${node.id}`,
        nodeType: 'CHATGPT',
        order,
        config,
      };
      
    case 'gemini':
      // Extract chatId from webhook data if available
      const geminiChatId = previousResults?.webhook?.message?.chat?.id || null;
      console.log(`[Converter] 🔍 Gemini chatId extraction:`, {
        hasWebhook: !!previousResults?.webhook,
        hasMessage: !!previousResults?.webhook?.message,
        hasChat: !!previousResults?.webhook?.message?.chat,
        chatId: geminiChatId
      });
      
      config = {
        model: data.model || 'gemini-pro',
        systemPrompt: data.systemPrompt || 'Bạn là trợ lý AI thân thiện.',
        userMessage: data.userMessage || '{{webhook.message.text}}', // Pass template as-is, workflow will evaluate
        maxTokens: parseInt(data.maxTokens || '2048'),
        temperature: parseFloat(data.temperature || '0.7'),
        chatId: geminiChatId, // Use actual chatId value
        useConversationHistory: true, // Always enable for Telegram bots
      };
      
      return {
        nodeId: node.id,
        activityName: `GEMINI_${node.id}`,
        nodeType: 'GEMINI',
        order,
        config,
      };
      
    case 'contentFilter':
      // Parse keywords from textarea (one per line)
      const keywordsText = data.keywords || '';
      const keywordsArray = keywordsText
        .split('\n')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);
      
      config = {
        inputText: data.inputText || '{{gemini-1.response}}', // Pass template as-is, workflow will evaluate
        keywords: keywordsArray,
        rejectionMessage: data.rejectionMessage || '⚠️ Nội dung không phù hợp',
        caseSensitive: data.caseSensitive || false,
      };
      
      return {
        nodeId: node.id,
        activityName: `FILTER_${node.id}`,
        nodeType: 'CONTENT_FILTER',
        order,
        config,
      };
      
    case 'googleSheets':
      // Parse values if it's a JSON string
      let valuesArray = [];
      if (data.values) {
        try {
          valuesArray = typeof data.values === 'string' 
            ? JSON.parse(data.values) 
            : data.values;
          
          // Replace workflow.* and webhook.* templates with proper format
          valuesArray = valuesArray.map((row: any[]) => 
            row.map((cell: any) => {
              if (typeof cell !== 'string') return cell;
              
              // Replace {{workflow.timestamp}} with actual timestamp template
              cell = cell.replace(/\{\{workflow\.timestamp\}\}/g, new Date().toISOString());
              
              // Keep webhook templates as-is (they will be evaluated by workflow)
              // Already in correct format: {{webhook.message.text}}, {{webhook.message.from.username}}, etc.
              
              return cell;
            })
          );
        } catch (e) {
          console.error('[Converter] Failed to parse Google Sheets values:', e);
        }
      }
      
      config = {
        spreadsheetId: data.spreadsheetId || '',
        action: data.action || 'READ',
        sheetName: data.sheetName || '',
        range: data.range || 'A:Z',
        values: valuesArray,
        // Support both Service Account JSON and API Key
        serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
        // Note: API Key will be read from process.env.GOOGLE_API_KEY in activity
      };
      
      return {
        nodeId: node.id,
        activityName: `SHEETS_${node.id}`,
        nodeType: 'GOOGLE_SHEETS',
        order,
        config,
      };
      
    default:
      console.warn(`Unknown node type: ${nodeType}`);
      return null;
  }
}

/**
 * Validate workflow before execution
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): string[] {
  const errors: string[] = [];
  
  // Check có ít nhất 1 custom node (không tính input/output)
  const customNodes = nodes.filter(n => 
    n.type !== 'input' && n.type !== 'output' && n.type !== 'default'
  );
  
  if (customNodes.length === 0) {
    errors.push('Workflow phải có ít nhất 1 node để thực thi');
  }
  
  // Check node configs (bỏ check kết nối)
  for (const node of nodes) {
    const data = node.data;
    
    switch (node.type) {
      case 'httpRequest':
        if (!data.url) {
          errors.push(`HTTP Request node thiếu URL`);
        }
        break;
        
      case 'database':
        if (!data.table) {
          errors.push(`Database node thiếu tên table`);
        }
        break;
        
      case 'email':
        if (!data.to) {
          errors.push(`Email node thiếu người nhận`);
        }
        if (!data.subject) {
          errors.push(`Email node thiếu tiêu đề`);
        }
        break;
        
      case 'delay':
        if (!data.duration || parseInt(data.duration) <= 0) {
          errors.push(`Delay node thiếu thời gian chờ hợp lệ`);
        }
        break;
        
      case 'conditional':
        if (!data.condition) {
          errors.push(`Conditional node thiếu điều kiện`);
        }
        break;
        
      case 'telegram':
        if (!data.chatId) {
          errors.push(`Telegram node thiếu Chat ID`);
        }
        if (!data.text) {
          errors.push(`Telegram node thiếu nội dung tin nhắn`);
        }
        break;
        
      case 'chatgpt':
        if (!data.userMessage) {
          errors.push(`ChatGPT node thiếu user message`);
        }
        const maxTokens = parseInt(data.maxTokens || '500');
        if (maxTokens < 1 || maxTokens > 4000) {
          errors.push(`ChatGPT node maxTokens phải từ 1-4000`);
        }
        const temperature = parseFloat(data.temperature || '0.7');
        if (temperature < 0 || temperature > 2) {
          errors.push(`ChatGPT node temperature phải từ 0-2`);
        }
        break;
        
      case 'gemini':
        if (!data.userMessage) {
          errors.push(`Gemini node thiếu user message`);
        }
        const geminiMaxTokens = parseInt(data.maxTokens || '2048');
        if (geminiMaxTokens < 1 || geminiMaxTokens > 8000) {
          errors.push(`Gemini node maxTokens phải từ 1-8000`);
        }
        const geminiTemperature = parseFloat(data.temperature || '0.7');
        if (geminiTemperature < 0 || geminiTemperature > 2) {
          errors.push(`Gemini node temperature phải từ 0-2`);
        }
        break;
        
      case 'contentFilter':
        if (!data.inputText) {
          errors.push(`Content Filter node thiếu input text`);
        }
        if (!data.keywords || data.keywords.trim().length === 0) {
          errors.push(`Content Filter node thiếu keywords`);
        }
        break;
    }
  }
  
  return errors;
}

/**
 * Temporal Workflow - Orchestration Logic
 * Workflow chạy các activities theo thứ tự từ React Flow
 */

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// Proxy tất cả activities với timeout và retry policies chi tiết
const {
  executeHttpRequestActivity,
  executeDatabaseActivity,
  sendEmailActivity,
  delayActivity,
  conditionalActivity,
  sendTelegramMessage,
  callChatGPT,
  callGemini,
  filterContent,
  googleSheetsOperation,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1s',        // Retry sau 1s
    backoffCoefficient: 2,         // Mỗi lần retry tăng gấp đôi (1s, 2s, 4s, 8s...)
    maximumInterval: '1 minute',   // Tối đa chờ 1 phút giữa các retry
    maximumAttempts: 3,            // Retry tối đa 3 lần
    nonRetryableErrorTypes: [],    // Có thể thêm error types không retry
  },
  // Timeout cho từng activity type có thể customize sau
  heartbeatTimeout: '30s',         // Activity phải heartbeat mỗi 30s nếu long-running
});

export interface TemporalActivityConfig {
  nodeId: string;
  activityName: string;
  nodeType: string;
  config: any;
  order: number;
  condition?: {
    sourceNode: string;
    sourceHandle: string;
  };
}

/**User: "Báo tôi khi iPhone 15 giảm giá"
  ↓
[Schedule] → Chạy mỗi 6 giờ
  ↓
[Web Scraper] → Lấy giá từ Tiki
  Config:
  - URL: "https://tiki.vn/iphone-15"
  - Selector: ".product-price"
  - Extract: "price, discount, availability"
  Output: {
    price: 25990000,
    discount: 10,
    inStock: true,
    lastChecked: "2025-12-02T23:45:00"
  }
  ↓
[Conditional] → Check giá < 24 triệu?
  ↓ (TRUE)
[Telegram] → "🔥 iPhone 15 giảm còn 23.9tr!"
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
        console.log(`[Workflow] 🔍 Found node by prefix: ${nodeId} -> ${matchingKey}`);
      }
    }
    
    if (!nodeResult) {
      console.log(`[Workflow] Variable not found: ${nodeId}`);
      return match; // Keep original if not found
    }
    
    // Navigate nested path: body.data.name -> nodeResult.body.data.name
    const pathParts = path.split('.');
    let value = nodeResult;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.log(`[Workflow] Path not found: ${nodeId}.${path}`);
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
 * Main workflow - Execute activities theo sequence từ React Flow
 */
export async function executeWorkflow(
  workflowId: string,
  activities: TemporalActivityConfig[],
  contextData?: Record<string, any> // Added: Accept webhook data and other context
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  // Initialize results with context data (webhook payload, etc.)
  if (contextData) {
    Object.assign(results, contextData);
    console.log(`[Workflow ${workflowId}] Initialized with context:`, Object.keys(contextData));
  }
  
  const executionDetails: Array<{
    activityName: string;
    nodeType: string;
    status: 'SUCCESS' | 'FAILURE';
    startTime: Date;
    endTime: Date;
    executionTime: number;
    output?: any;
    error?: { message: string; code?: string; stack?: string };
  }> = [];

  console.log(`[Workflow ${workflowId}] Bắt đầu với ${activities.length} activities`);

  // Sort activities theo order
  const sortedActivities = [...activities].sort((a, b) => a.order - b.order);

  // Execute từng activity
  for (const activity of sortedActivities) {
    const startTime = new Date();
    
    // ⚡ Kiểm tra condition trước khi chạy
    if (activity.condition) {
      const { sourceNode, sourceHandle } = activity.condition;
      const sourceResult = results[sourceNode];
      
      // Tìm alias của source node (filter-1, filter-2, ...)
      const sourceAlias = Object.keys(results).find(key => 
        key.startsWith('filter-') && results[key] === sourceResult
      );
      
      console.log(`[Workflow] Checking condition for ${activity.activityName}: ${sourceNode} (${sourceAlias || sourceNode}) must be ${sourceHandle}`);
      
      // ✅ FIX: If source node didn't run (undefined), skip this activity
      if (!sourceResult || typeof sourceResult.passed !== 'boolean') {
        console.log(`[Workflow] ⏭️  Skipping ${activity.activityName} (source node ${sourceNode} not executed or has no result)`);
        continue;
      }
      
      const shouldRun = (sourceHandle === 'pass' && sourceResult.passed) || 
                       (sourceHandle === 'reject' && !sourceResult.passed);
      
      if (!shouldRun) {
        console.log(`[Workflow] ⏭️  Skipping ${activity.activityName} (condition not met: ${sourceHandle})`);
        continue; // Skip activity này
      }
      
      console.log(`[Workflow] ✅ Condition met, executing ${activity.activityName}`);
    }
    
    console.log(`[Workflow] Executing: ${activity.activityName} (${activity.nodeType})`);

    try {
      let result: any;

      // Evaluate templates in config using previousResults
      const evaluatedConfig = evaluateConfigTemplates(activity.config, results);
      
      console.log(`[Workflow] Config after template evaluation:`, JSON.stringify(evaluatedConfig, null, 2));

      switch (activity.nodeType) {
        case 'HTTP_REQUEST':
          result = await executeHttpRequestActivity(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'DATABASE':
          result = await executeDatabaseActivity(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'EMAIL':
          result = await sendEmailActivity(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'DELAY':
          await delayActivity(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          result = { delayed: evaluatedConfig.delayMs };
          break;

        case 'CONDITIONAL':
          const conditionResult = await conditionalActivity(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          result = { conditionMet: conditionResult };
          
          // Nếu condition false, có thể stop workflow
          if (!conditionResult) {
            console.log('[Workflow] Condition not met, stopping workflow');
            results[activity.nodeId] = result;
            break;
          }
          break;

        case 'TELEGRAM':
          result = await sendTelegramMessage(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'CHATGPT':
          result = await callChatGPT(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'GEMINI':
          result = await callGemini(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        case 'CONTENT_FILTER':
          result = await filterContent(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          
          // ⚠️ ContentFilter returns { passed: boolean }
          // Skip subsequent nodes if filter determines the wrong branch
          results[activity.nodeId] = result;
          
          // If this is a filter node, store the decision for downstream nodes
          if (result && typeof result.passed === 'boolean') {
            console.log(`[Workflow] ContentFilter result: ${result.passed ? 'PASS' : 'REJECT'}`);
          }
          break;

        case 'GOOGLE_SHEETS':
          result = await googleSheetsOperation(evaluatedConfig, {
            workflowId,
            previousResults: results,
          });
          break;

        default:
          throw new Error(`Unknown activity type: ${activity.nodeType}`);
      }

      // Lưu kết quả để activities tiếp theo có thể sử dụng
      // (Note: ContentFilter already stored above to enable branching logic)
      if (activity.nodeType !== 'CONTENT_FILTER') {
        results[activity.nodeId] = result;
      }
      
      // ✨ Create friendly aliases for easier template usage
      // Example: gemini-1764521667996 → also stored as "gemini-1", "filter-1764... → "filter-1"
      const nodeType = activity.nodeType.toLowerCase();
      let typePrefix = nodeType;
      
      // Map node types to clean prefixes
      if (nodeType === 'content_filter') typePrefix = 'filter';
      else if (nodeType === 'google_sheets') typePrefix = 'sheets';
      else if (nodeType === 'http_request') typePrefix = 'http';
      // Remove underscores for other types
      else typePrefix = nodeType.replace(/_/g, '');
      
      // Count how many nodes of this type we've seen
      const typeCount = Object.keys(results).filter(key => 
        key.startsWith(typePrefix) || activities.find(a => a.nodeId === key && a.nodeType === activity.nodeType)
      ).length;
      
      const alias = `${typePrefix}-${typeCount || 1}`;
      results[alias] = result;
      
      console.log(`[Workflow] 📌 Stored result with alias: ${alias} (original ID: ${activity.nodeId})`);

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Track execution details
      executionDetails.push({
        activityName: activity.activityName,
        nodeType: activity.nodeType,
        status: 'SUCCESS',
        startTime,
        endTime,
        executionTime,
        output: result,
      });

      console.log(`[Workflow] ✅ ${activity.activityName} completed (${executionTime}ms)`);
    } catch (error: any) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Track error details
      executionDetails.push({
        activityName: activity.activityName,
        nodeType: activity.nodeType,
        status: 'FAILURE',
        startTime,
        endTime,
        executionTime,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      });

      console.error(`[Workflow] ❌ Activity ${activity.activityName} failed after ${executionTime}ms:`, error);
      throw new Error(`Activity failed - ${activity.activityName}: ${error.message}`);
    }
  }

  console.log(`[Workflow ${workflowId}] ✅ Hoàn thành tất cả activities`);
  
  // Return both results and execution details
  return {
    ...results,
    __executionDetails: executionDetails,
  };
}

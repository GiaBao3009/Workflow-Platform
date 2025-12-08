/**
 * MongoDB Schema Definitions cho Workflow Platform
 * Sử dụng Mongoose cho type-safe database operations
 */

import { Schema, Document, model } from 'mongoose';

// ==================== USERS COLLECTION ====================
export interface IUser extends Document {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    createdAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Index cho email
userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1 });

export const User = model<IUser>('User', userSchema);

// ==================== WORKFLOWS COLLECTION ====================
export interface IReactFlowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface IReactFlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface IReactFlowData {
  nodes: IReactFlowNode[];
  edges: IReactFlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface ITemporalActivityConfig {
  nodeId: string; // ID từ React Flow
  activityName: string; // Tên Temporal Activity để gọi
  nodeType: string; // Loại node: ACTION_HTTP_REQUEST, DATABASE_MONGO_WRITE, ...
  config: Record<string, any>; // Cấu hình chi tiết
  successors: string[]; // Array of nodeId của node tiếp theo
  retryPolicy?: {
    maxAttempts?: number;
    backoffMultiplier?: number;
    initialInterval?: number;
    maxInterval?: number;
  };
}

export interface IWorkflow extends Document {
  _id: string;
  userId: string; // ObjectId của users collection
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  isArchived: boolean;
  triggerType: 'MANUAL' | 'WEBHOOK' | 'CRON';
  webhookUrl?: string; // Nếu triggerType = WEBHOOK
  cronExpression?: string; // Nếu triggerType = CRON (ví dụ: "0 0 * * *")
  reactFlowData: IReactFlowData; // Dữ liệu gốc từ React Flow
  temporalConfig: ITemporalActivityConfig[]; // Execution Plan cho Temporal
  createdAt: Date;
  updatedAt: Date;
}

const temporalConfigSchema = new Schema(
  {
    nodeId: {
      type: String,
      required: true,
    },
    activityName: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
    successors: {
      type: [String],
      default: [],
    },
    retryPolicy: {
      type: {
        maxAttempts: Number,
        backoffMultiplier: Number,
        initialInterval: Number,
        maxInterval: Number,
      },
      default: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialInterval: 1000,
        maxInterval: 32000,
      },
    },
  },
  { _id: false }
);

const workflowSchema = new Schema<IWorkflow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      required: true,
      default: 'draft',
    },
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
    },
    triggerType: {
      type: String,
      enum: ['MANUAL', 'WEBHOOK', 'CRON'],
      required: true,
    },
    webhookUrl: {
      type: String,
      unique: true,
      sparse: true, // Chỉ unique khi có giá trị
    },
    cronExpression: {
      type: String,
    },
    reactFlowData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    temporalConfig: {
      type: [temporalConfigSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

// Index để tìm nhanh
workflowSchema.index({ userId: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ createdAt: -1 });
workflowSchema.index({ webhookUrl: 1 });

export const Workflow = model<IWorkflow>('Workflow', workflowSchema);

// ==================== WORKFLOW_RUNS COLLECTION ====================
export interface IActivityResult {
  activityName: string;
  nodeType: string;
  status: 'SUCCESS' | 'FAILURE';
  startTime: Date;
  endTime: Date;
  executionTime: number; // milliseconds
  output?: any;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export interface IWorkflowRun extends Document {
  _id: string;
  workflowId: string; // ObjectId của workflows collection
  temporalWorkflowId: string; // Workflow ID từ Temporal Server
  temporalRunId: string; // Run ID từ Temporal Server
  startTime: Date;
  endTime?: Date;
  status: 'RUNNING' | 'SUCCESS' | 'FAILURE' | 'TERMINATED';
  triggerContext?: Record<string, any>; // Payload từ webhook hoặc scheduler
  executionDetails?: IActivityResult[]; // Lịch sử thực thi từng activity
  errorDetails?: {
    message: string;
    stack?: string;
    failedActivityName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const activityResultSchema = new Schema(
  {
    activityName: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    executionTime: {
      type: Number,
      required: true,
    },
    output: {
      type: Schema.Types.Mixed,
    },
    error: {
      message: String,
      code: String,
      stack: String,
    },
  },
  { _id: false }
);

const workflowRunSchema = new Schema<IWorkflowRun>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    temporalWorkflowId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    temporalRunId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['RUNNING', 'SUCCESS', 'FAILURE', 'TERMINATED'],
      required: true,
      default: 'RUNNING',
    },
    triggerContext: {
      type: Schema.Types.Mixed,
    },
    executionDetails: {
      type: [activityResultSchema],
      default: [],
    },
    errorDetails: {
      message: String,
      stack: String,
      failedActivityName: String,
    },
  },
  { timestamps: true }
);

// Index để tìm nhanh
workflowRunSchema.index({ workflowId: 1, createdAt: -1 });
workflowRunSchema.index({ status: 1 });
workflowRunSchema.index({ startTime: -1 });

export const WorkflowRun = model<IWorkflowRun>(
  'WorkflowRun',
  workflowRunSchema
);

// ==================== WORKFLOW SCHEDULES COLLECTION ====================
export interface IWorkflowSchedule extends Document {
  _id: string;
  workflowId: string; // ObjectId của workflow
  temporalScheduleId: string; // Schedule ID từ Temporal
  name: string; // Tên schedule (e.g., "Daily Report at 9 AM")
  description?: string;
  cronExpression: string; // CRON format: "0 9 * * *"
  timezone?: string; // Default: UTC
  isActive: boolean; // Pause/resume schedule
  lastRunTime?: Date; // Thời gian chạy gần nhất
  nextRunTime?: Date; // Thời gian chạy tiếp theo
  triggerContext?: Record<string, any>; // Payload mặc định khi trigger
  createdBy?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

const workflowScheduleSchema = new Schema<IWorkflowSchedule>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    temporalScheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cronExpression: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    lastRunTime: {
      type: Date,
    },
    nextRunTime: {
      type: Date,
    },
    triggerContext: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes
workflowScheduleSchema.index({ workflowId: 1, isActive: 1 });
workflowScheduleSchema.index({ isActive: 1, nextRunTime: 1 });

export const WorkflowSchedule = model<IWorkflowSchedule>(
  'WorkflowSchedule',
  workflowScheduleSchema
);

// ==================== WEBHOOKS COLLECTION ====================
export interface IWebhook extends Document {
  _id: string;
  workflowId: any;
  name: string;
  description?: string;
  apiKey: string; // Auto-generated unique key
  secret?: string; // For HMAC signature verification (optional)
  isActive: boolean;
  allowedIPs?: string[]; // Whitelist IPs (optional)
  rateLimitPerMinute?: number; // Default: 60
  lastTriggeredAt?: Date;
  triggerCount: number;
  createdBy?: any;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secret: {
      type: String, // For HMAC SHA-256 signature
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowedIPs: {
      type: [String],
    },
    rateLimitPerMinute: {
      type: Number,
      default: 60,
    },
    lastTriggeredAt: {
      type: Date,
    },
    triggerCount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes
webhookSchema.index({ workflowId: 1, isActive: 1 });
webhookSchema.index({ apiKey: 1 });

export const Webhook = model<IWebhook>('Webhook', webhookSchema);

// ==================== WEBHOOK LOGS COLLECTION ====================
export interface IWebhookLog extends Document {
  _id: string;
  webhookId: any;
  workflowId: any;
  workflowRunId?: any; // Reference to WorkflowRun if workflow was triggered
  requestMethod: string; // POST, GET, etc.
  requestHeaders: Record<string, any>;
  requestBody: Record<string, any>;
  requestIP: string;
  responseStatus: number; // 200, 401, 500, etc.
  responseBody?: Record<string, any>;
  errorMessage?: string;
  duration: number; // milliseconds
  createdAt: Date;
}

const webhookLogSchema = new Schema<IWebhookLog>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      ref: 'Webhook',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    workflowRunId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowRun',
    },
    requestMethod: {
      type: String,
      required: true,
    },
    requestHeaders: {
      type: Schema.Types.Mixed,
      required: true,
    },
    requestBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    requestIP: {
      type: String,
      required: true,
    },
    responseStatus: {
      type: Number,
      required: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
webhookLogSchema.index({ webhookId: 1, createdAt: -1 });
webhookLogSchema.index({ workflowId: 1, createdAt: -1 });

export const WebhookLog = model<IWebhookLog>('WebhookLog', webhookLogSchema);

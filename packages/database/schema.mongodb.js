"use strict";
/**
 * MongoDB Schema Definitions cho Workflow Platform
 * Sử dụng Mongoose cho type-safe database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRun = exports.Workflow = exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Organization',
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
}, { timestamps: true });
// Index cho email
userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
const temporalConfigSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, { _id: false });
const workflowSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    temporalConfig: {
        type: [temporalConfigSchema],
        required: true,
        default: [],
    },
}, { timestamps: true });
// Index để tìm nhanh
workflowSchema.index({ userId: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ createdAt: -1 });
workflowSchema.index({ webhookUrl: 1 });
exports.Workflow = (0, mongoose_1.model)('Workflow', workflowSchema);
const activityResultSchema = new mongoose_1.Schema({
    activityName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        required: true,
    },
    output: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    error: {
        message: String,
        code: String,
    },
    executionTime: {
        type: Number,
        required: true,
    },
}, { _id: false });
const workflowRunSchema = new mongoose_1.Schema({
    workflowId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, { timestamps: true });
// Index để tìm nhanh
workflowRunSchema.index({ workflowId: 1, createdAt: -1 });
workflowRunSchema.index({ status: 1 });
workflowRunSchema.index({ startTime: -1 });
exports.WorkflowRun = (0, mongoose_1.model)('WorkflowRun', workflowRunSchema);

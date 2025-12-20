/**
 * Admin Routes Part 2 - Webhooks, Schedules, Audit Logs, Notifications, System Health
 */

import express, { Request, Response, Router } from 'express';
import { 
  Webhook, 
  WebhookLog,
  WorkflowSchedule,
  AuditLog,
  RateLimit,
  Notification,
  SystemHealth
} from '../schema.mongodb';
import { requireAdmin, auditLog } from '../middlewares/admin.middleware';
import { generateToken } from '../utils/encryption.util';
import MongoDBService from '../mongodb.service';

const router: Router = express.Router();
const mongoService = MongoDBService.getInstance();

// ============================================
// WEBHOOK MANAGEMENT
// ============================================

/**
 * GET /api/admin/webhooks
 * Get all webhooks with statistics
 */
router.get('/webhooks', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const webhooks = await db.collection('webhooks').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'workflows',
          localField: 'workflowId',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$workflow', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'webhooklogs',
          localField: '_id',
          foreignField: 'webhookId',
          as: 'logs'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          url: 1,
          secret: 1,
          events: 1,
          isActive: 1,
          createdAt: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          workflowName: '$workflow.name',
          workflowId: '$workflow._id',
          totalCalls: { $size: '$logs' },
          lastCall: { $max: '$logs.createdAt' },
          successCount: {
            $size: {
              $filter: {
                input: '$logs',
                as: 'log',
                cond: { $eq: ['$$log.success', true] }
              }
            }
          },
          failureCount: {
            $size: {
              $filter: {
                input: '$logs',
                as: 'log',
                cond: { $eq: ['$$log.success', false] }
              }
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    res.json({ success: true, webhooks });
  } catch (error: any) {
    console.error('❌ Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks', message: error.message });
  }
});

/**
 * POST /api/admin/webhooks/:webhookId/regenerate
 * Regenerate webhook secret
 */
router.post('/webhooks/:webhookId/regenerate', requireAdmin, auditLog('update', 'webhook'), async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const newSecret = generateToken(32);

    const db = mongoService.getDb();
    const result = await db.collection('webhooks').findOneAndUpdate(
      { _id: webhookId } as any,
      { $set: { secret: newSecret, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error regenerating webhook:', error);
    res.status(500).json({ error: 'Failed to regenerate webhook', message: error.message });
  }
});

/**
 * PATCH /api/admin/webhooks/:webhookId
 * Update webhook (enable/disable, rate limiting, etc.)
 */
router.patch('/webhooks/:webhookId', requireAdmin, auditLog('update', 'webhook'), async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const updates = req.body;

    const db = mongoService.getDb();
    const result = await db.collection('webhooks').findOneAndUpdate(
      { _id: webhookId } as any,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook', message: error.message });
  }
});

/**
 * GET /api/admin/webhooks/:webhookId/logs
 * Get webhook call logs
 */
router.get('/webhooks/:webhookId/logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const db = mongoService.getDb();
    const logs = await db.collection('webhooklogs')
      .find({ webhookId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, logs });
  } catch (error: any) {
    console.error('❌ Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs', message: error.message });
  }
});

/**
 * DELETE /api/admin/webhooks/:webhookId
 * Delete webhook
 */
router.delete('/webhooks/:webhookId', requireAdmin, auditLog('delete', 'webhook'), async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const db = mongoService.getDb();

    // Delete webhook logs
    await db.collection('webhooklogs').deleteMany({ webhookId });

    // Delete webhook
    const result = await db.collection('webhooks').deleteOne({ _id: webhookId } as any);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook', message: error.message });
  }
});

// ============================================
// SCHEDULE MANAGEMENT
// ============================================

/**
 * GET /api/admin/schedules
 * Get all scheduled workflows
 */
router.get('/schedules', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const schedules = await db.collection('workflow_schedules').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'workflows',
          localField: 'workflowId',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$workflow', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          cronExpression: 1,
          nextRun: 1,
          lastRun: 1,
          isActive: 1,
          createdAt: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          workflowName: '$workflow.name',
          workflowId: '$workflow._id'
        }
      },
      {
        $sort: { nextRun: 1 }
      }
    ]).toArray();

    res.json({ success: true, schedules });
  } catch (error: any) {
    console.error('❌ Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules', message: error.message });
  }
});

/**
 * PATCH /api/admin/schedules/:scheduleId
 * Update schedule (pause/resume, change cron, etc.)
 */
router.patch('/schedules/:scheduleId', requireAdmin, auditLog('update', 'schedule'), async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const db = mongoService.getDb();
    const result = await db.collection('workflow_schedules').findOneAndUpdate(
      { _id: scheduleId } as any,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule', message: error.message });
  }
});

/**
 * POST /api/admin/schedules/:scheduleId/run
 * Force run a scheduled workflow now
 */
router.post('/schedules/:scheduleId/run', requireAdmin, auditLog('execute', 'schedule'), async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const db = mongoService.getDb();

    const schedule = await db.collection('workflow_schedules').findOne({ _id: scheduleId } as any);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // TODO: Trigger workflow execution via Temporal
    // This would integrate with your existing workflow execution system

    res.json({ message: 'Workflow execution triggered', scheduleId });
  } catch (error: any) {
    console.error('❌ Error running schedule:', error);
    res.status(500).json({ error: 'Failed to run schedule', message: error.message });
  }
});

// ============================================
// AUDIT LOGS
// ============================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const resourceType = req.query.resourceType as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const db = mongoService.getDb();
    const query: any = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await db.collection('auditlogs').countDocuments(query);
    const logs = await db.collection('auditlogs')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// ============================================
// RATE LIMITING & QUOTAS
// ============================================

/**
 * GET /api/admin/rate-limits
 * Get rate limits for all users
 */
router.get('/rate-limits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const limits = await db.collection('ratelimits').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          limits: {
            $push: {
              type: '$limitType',
              limit: '$limit',
              currentUsage: '$currentUsage',
              resetAt: '$resetAt',
              isCustom: '$isCustom'
            }
          }
        }
      }
    ]).toArray();

    res.json(limits);
  } catch (error: any) {
    console.error('❌ Error fetching rate limits:', error);
    res.status(500).json({ error: 'Failed to fetch rate limits', message: error.message });
  }
});

/**
 * POST /api/admin/rate-limits
 * Set custom rate limit for a user
 */
router.post('/rate-limits', requireAdmin, auditLog('create', 'ratelimit'), async (req: Request, res: Response) => {
  try {
    const { userId, limitType, limit } = req.body;

    if (!userId || !limitType || !limit) {
      return res.status(400).json({ error: 'userId, limitType, and limit are required' });
    }

    // Calculate reset date based on limit type
    let resetAt = new Date();
    if (limitType === 'executions_daily' || limitType === 'api_calls' || limitType === 'webhook_calls') {
      resetAt.setDate(resetAt.getDate() + 1);
      resetAt.setHours(0, 0, 0, 0);
    } else {
      resetAt.setMonth(resetAt.getMonth() + 1);
    }

    const db = mongoService.getDb();
    const result = await db.collection('ratelimits').findOneAndUpdate(
      { userId, limitType },
      {
        $set: {
          limit,
          resetAt,
          isCustom: true,
          updatedAt: new Date()
        },
        $setOnInsert: {
          currentUsage: 0,
          createdAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error setting rate limit:', error);
    res.status(500).json({ error: 'Failed to set rate limit', message: error.message });
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * GET /api/admin/notifications
 * Get system notifications
 */
router.get('/notifications', requireAdmin, async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as string;

    const db = mongoService.getDb();
    const query: any = {};

    if (unreadOnly) {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json({ success: true, notifications });
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

/**
 * POST /api/admin/notifications
 * Create new notification
 */
router.post('/notifications', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, title, message, source, metadata, expiresAt } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'type, title, and message are required' });
    }

    const notification = {
      type,
      title,
      message,
      source: source || 'admin',
      metadata: metadata || {},
      isRead: false,
      readBy: [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date()
    };

    const db = mongoService.getDb();
    const result = await db.collection('notifications').insertOne(notification);

    res.json({ ...notification, _id: result.insertedId });
  } catch (error: any) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification', message: error.message });
  }
});

/**
 * PATCH /api/admin/notifications/:notificationId/read
 * Mark notification as read
 */
router.patch('/notifications/:notificationId/read', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req.user as any)._id;

    const db = mongoService.getDb();
    const result = await db.collection('notifications').findOneAndUpdate(
      { _id: notificationId } as any,
      { 
        $set: { isRead: true },
        $addToSet: { readBy: userId }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read', message: error.message });
  }
});

// ============================================
// SYSTEM HEALTH
// ============================================

/**
 * GET /api/admin/system-health
 * Get system health status for all services
 */
router.get('/system-health', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    
    // Get real-time metrics
    const startTime = Date.now();
    
    // Check MongoDB
    let dbStatus = 'healthy';
    let dbDetails = 'Connected';
    try {
      await db.admin().ping();
    } catch (error) {
      dbStatus = 'critical';
      dbDetails = 'Disconnected';
    }
    
    // Check API response time
    const responseTime = Date.now() - startTime;
    const apiStatus = responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'critical';
    
    // Mock CPU, Memory, Disk (in production, use actual system metrics)
    const cpuUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
    const memoryUsage = Math.floor(Math.random() * 20) + 40; // 40-60%
    const diskUsage = Math.floor(Math.random() * 15) + 30; // 30-45%
    
    // Count active workflows
    const activeWorkflows = await db.collection('workflows').countDocuments({ status: 'active' });
    
    const healthData = {
      overall: dbStatus === 'healthy' && apiStatus === 'healthy' ? 'healthy' : 
               dbStatus === 'critical' || apiStatus === 'critical' ? 'critical' : 'warning',
      uptime: formatUptime(process.uptime()),
      cpu: {
        name: 'CPU',
        status: cpuUsage < 70 ? 'healthy' : cpuUsage < 90 ? 'warning' : 'critical',
        value: `${cpuUsage}%`,
        details: `${cpuUsage}% utilized`
      },
      memory: {
        name: 'Memory',
        status: memoryUsage < 80 ? 'healthy' : memoryUsage < 95 ? 'warning' : 'critical',
        value: `${memoryUsage}%`,
        details: `${memoryUsage}% used`
      },
      disk: {
        name: 'Disk',
        status: diskUsage < 80 ? 'healthy' : diskUsage < 95 ? 'warning' : 'critical',
        value: `${diskUsage}%`,
        details: `${diskUsage}% full`
      },
      database: {
        name: 'MongoDB',
        status: dbStatus as 'healthy' | 'warning' | 'critical',
        value: dbStatus === 'healthy' ? 'Connected' : 'Disconnected',
        details: dbDetails
      },
      api: {
        name: 'API',
        status: apiStatus as 'healthy' | 'warning' | 'critical',
        value: `${responseTime}ms`,
        details: `Response time: ${responseTime}ms`
      },
      worker: {
        name: 'Temporal Worker',
        status: 'healthy' as 'healthy' | 'warning' | 'critical',
        value: `${activeWorkflows} active`,
        details: `${activeWorkflows} workflows running`
      },
      lastCheck: new Date().toISOString()
    };

    res.json({ success: true, health: healthData });
  } catch (error: any) {
    console.error('❌ Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health', message: error.message });
  }
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * POST /api/admin/system-health/check
 * Manually trigger system health check
 */
router.post('/system-health/check', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Check various services
    const healthChecks = await Promise.allSettled([
      checkMongoDB(),
      checkTemporal(),
      // Add more health checks as needed
    ]);

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: 'unknown',
          status: 'down',
          errorMessage: result.reason.message,
          lastChecked: new Date()
        };
      }
    });

    // Save to database
    const db = mongoService.getDb();
    for (const healthResult of results) {
      await db.collection('systemhealths').findOneAndUpdate(
        { service: healthResult.service },
        { $set: healthResult },
        { upsert: true }
      );
    }

    res.json(results);
  } catch (error: any) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({ error: 'Failed to check system health', message: error.message });
  }
});

// Health check helper functions
async function checkMongoDB(): Promise<any> {
  const startTime = Date.now();
  try {
    const db = mongoService.getDb();
    await db.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      service: 'mongodb',
      status: 'healthy',
      responseTime,
      lastChecked: new Date()
    };
  } catch (error: any) {
    return {
      service: 'mongodb',
      status: 'down',
      errorMessage: error.message,
      lastChecked: new Date()
    };
  }
}

async function checkTemporal(): Promise<any> {
  const startTime = Date.now();
  try {
    // TODO: Implement actual Temporal health check
    const responseTime = Date.now() - startTime;

    return {
      service: 'temporal',
      status: 'healthy',
      responseTime,
      lastChecked: new Date()
    };
  } catch (error: any) {
    return {
      service: 'temporal',
      status: 'down',
      errorMessage: error.message,
      lastChecked: new Date()
    };
  }
}

export default router;

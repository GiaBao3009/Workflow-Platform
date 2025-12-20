/**
 * Admin Routes - Comprehensive admin panel endpoints
 * Includes: Dashboard, Users, API Keys, Webhooks, Schedules, Notifications, Audit Logs, System Health
 */

import express, { Request, Response, Router } from 'express';
import { 
  User, 
  Workflow, 
  WorkflowRun, 
  WorkflowSchedule, 
  Webhook, 
  WebhookLog,
  ApiKey,
  AuditLog,
  RateLimit,
  Notification,
  SystemHealth
} from '../schema.mongodb';
import { requireAuth, requireAdmin, auditLog } from '../middlewares/admin.middleware';
import { encrypt, decrypt, maskApiKey, generateToken } from '../utils/encryption.util';
import MongoDBService from '../mongodb.service';

const router: Router = express.Router();
const mongoService = MongoDBService.getInstance();

// ============================================
// DASHBOARD & STATISTICS
// ============================================

/**
 * GET /api/admin/dashboard
 * Get comprehensive admin dashboard statistics
 */
router.get('/dashboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    
    // User stats
    const totalUsers = await db.collection('users').countDocuments();
    const activeUsers = await db.collection('users').countDocuments({ isActive: true });
    const newUsersThisMonth = await db.collection('users').countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    // Workflow stats
    const totalWorkflows = await db.collection('workflows').countDocuments();
    const activeWorkflows = await db.collection('workflows').countDocuments({ status: 'active' });
    
    // Execution stats
    const totalExecutions = await db.collection('workflow_runs').countDocuments();
    const completedExecutions = await db.collection('workflow_runs').countDocuments({ status: 'completed' });
    const failedExecutions = await db.collection('workflow_runs').countDocuments({ status: 'failed' });
    const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0;

    // Recent executions (last 7 days by day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentExecutions = await db.collection('workflow_runs').aggregate([
      {
        $match: {
          startedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]).toArray();

    // Webhook stats
    const totalWebhooks = await db.collection('webhooks').countDocuments();
    const activeWebhooks = await db.collection('webhooks').countDocuments({ isActive: true });

    // Schedule stats
    const totalSchedules = await db.collection('workflow_schedules').countDocuments();
    const activeSchedules = await db.collection('workflow_schedules').countDocuments({ isActive: true });

    // API Key stats
    const totalApiKeys = await db.collection('apikeys').countDocuments();
    const globalApiKeys = await db.collection('apikeys').countDocuments({ isGlobal: true });

    // System health
    const systemHealth = await db.collection('systemhealths').find({}).toArray();

    // Top users by workflow count
    const topUsers = await db.collection('workflows').aggregate([
      {
        $group: {
          _id: '$userId',
          workflowCount: { $sum: 1 }
        }
      },
      {
        $sort: { workflowCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          workflowCount: 1
        }
      }
    ]).toArray();

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      },
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows
      },
      executions: {
        total: totalExecutions,
        completed: completedExecutions,
        failed: failedExecutions,
        successRate,
        recentByDay: recentExecutions
      },
      webhooks: {
        total: totalWebhooks,
        active: activeWebhooks
      },
      schedules: {
        total: totalSchedules,
        active: activeSchedules
      },
      apiKeys: {
        total: totalApiKeys,
        global: globalApiKeys
      },
      systemHealth,
      topUsers
    });
  } catch (error: any) {
    console.error('❌ Error loading admin dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard', message: error.message });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive as string;

    const db = mongoService.getDb();
    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const total = await db.collection('users').countDocuments(query);
    const users = await db.collection('users')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({ password: 0, resetPasswordToken: 0 }) // Don't return sensitive fields
      .toArray();

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

/**
 * PATCH /api/admin/users/:userId
 * Update user (activate/deactivate, change role, etc.)
 */
router.patch('/users/:userId', requireAdmin, auditLog('update', 'user'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow updating sensitive fields via this endpoint
    delete updates.password;
    delete updates.resetPasswordToken;
    delete updates.resetPasswordExpires;

    const db = mongoService.getDb();
    const result = await db.collection('users').findOneAndUpdate(
      { _id: userId } as any,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user and all their data
 */
router.delete('/users/:userId', requireAdmin, auditLog('delete', 'user'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const db = mongoService.getDb();

    // Delete user's workflows
    await db.collection('workflows').deleteMany({ userId });

    // Delete user's schedules
    await db.collection('workflow_schedules').deleteMany({ userId });

    // Delete user's webhooks
    await db.collection('webhooks').deleteMany({ userId });

    // Delete user's API keys
    await db.collection('apikeys').deleteMany({ userId });

    // Delete user
    const result = await db.collection('users').deleteOne({ _id: userId } as any);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// ============================================
// API KEY MANAGEMENT  
// ============================================

/**
 * GET /api/admin/api-keys
 * Get all API keys (global and user keys)
 */
router.get('/api-keys', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const keys = await db.collection('apikeys').aggregate([
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
        $sort: { isGlobal: -1, createdAt: -1 }
      }
    ]).toArray();

    // Mask encrypted keys
    const maskedKeys = keys.map(key => ({
      ...key,
      maskedKey: maskApiKey(key.keyName || key.service),
      encryptedKey: undefined, // Don't send encrypted key to frontend
      userName: key.user?.name,
      userEmail: key.user?.email
    }));

    res.json({ success: true, apiKeys: maskedKeys });
  } catch (error: any) {
    console.error('❌ Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys', message: error.message });
  }
});

/**
 * POST /api/admin/api-keys
 * Create new API key (global or user-specific)
 */
router.post('/api-keys', requireAdmin, auditLog('create', 'apikey'), async (req: Request, res: Response) => {
  try {
    const { userId, service, keyName, apiKey, isGlobal, quotaLimit, expiresAt } = req.body;

    if (!service || !apiKey) {
      return res.status(400).json({ error: 'Service and API key are required' });
    }

    const encryptedKey = encrypt(apiKey);

    const newKey = {
      userId: userId || (req.user as any)._id,
      service,
      keyName: keyName || `${service} API Key`,
      encryptedKey,
      isGlobal: isGlobal || false,
      isActive: true,
      quotaUsed: 0,
      quotaLimit: quotaLimit || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date()
    };

    const db = mongoService.getDb();
    const result = await db.collection('apikeys').insertOne(newKey);

    res.json({ 
      ...newKey, 
      _id: result.insertedId,
      maskedKey: maskApiKey(keyName || service),
      encryptedKey: undefined 
    });
  } catch (error: any) {
    console.error('❌ Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key', message: error.message });
  }
});

/**
 * PATCH /api/admin/api-keys/:keyId
 * Update API key (activate/deactivate, update quota, etc.)
 */
router.patch('/api-keys/:keyId', requireAdmin, auditLog('update', 'apikey'), async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const updates = req.body;

    // If updating the actual API key
    if (updates.apiKey) {
      updates.encryptedKey = encrypt(updates.apiKey);
      delete updates.apiKey;
    }

    const db = mongoService.getDb();
    const result: any = await db.collection('apikeys').findOneAndUpdate(
      { _id: keyId } as any,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      ...result,
      maskedKey: maskApiKey(result.keyName || result.service),
      encryptedKey: undefined
    });
  } catch (error: any) {
    console.error('❌ Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key', message: error.message });
  }
});

/**
 * DELETE /api/admin/api-keys/:keyId
 * Delete API key
 */
router.delete('/api-keys/:keyId', requireAdmin, auditLog('delete', 'apikey'), async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const db = mongoService.getDb();

    const result = await db.collection('apikeys').deleteOne({ _id: keyId } as any);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key', message: error.message });
  }
});

/**
 * POST /api/admin/api-keys/:keyId/test
 * Test API key connection
 */
router.post('/api-keys/:keyId/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const db = mongoService.getDb();

    const apiKey: any = await db.collection('apikeys').findOne({ _id: keyId } as any);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const decryptedKey = decrypt(apiKey.encryptedKey);

    // Test connection based on service
    let testResult: any = { success: false, message: 'Service not supported for testing' };

    switch (apiKey.service) {
      case 'gemini':
        // Test Gemini API
        testResult = await testGeminiConnection(decryptedKey);
        break;
      case 'openai':
        // Test OpenAI API
        testResult = await testOpenAIConnection(decryptedKey);
        break;
      case 'telegram':
        // Test Telegram Bot
        testResult = await testTelegramConnection(decryptedKey);
        break;
      // Add more services as needed
    }

    // Update last used
    await db.collection('apikeys').updateOne(
      { _id: keyId } as any,
      { $set: { lastUsed: new Date() } }
    );

    res.json(testResult);
  } catch (error: any) {
    console.error('❌ Error testing API key:', error);
    res.status(500).json({ error: 'Failed to test API key', message: error.message });
  }
});

// Helper functions for testing API connections
async function testGeminiConnection(apiKey: string): Promise<any> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (response.ok) {
      return { success: true, message: 'Gemini API connection successful', status: response.status };
    } else {
      return { success: false, message: 'Gemini API connection failed', status: response.status };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testOpenAIConnection(apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (response.ok) {
      return { success: true, message: 'OpenAI API connection successful', status: response.status };
    } else {
      return { success: false, message: 'OpenAI API connection failed', status: response.status };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testTelegramConnection(botToken: string): Promise<any> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    if (response.ok) {
      const data: any = await response.json();
      return { success: true, message: `Connected to bot: ${data.result.username}`, botInfo: data.result };
    } else {
      return { success: false, message: 'Telegram bot connection failed', status: response.status };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// (Continue in next part - file is getting long)

export default router;

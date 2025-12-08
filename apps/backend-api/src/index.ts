import express, { Express, Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { Connection, Client } from '@temporalio/client';
import { convertWorkflowToTemporal, validateWorkflow } from './workflow-converter';
import MongoDBService from './mongodb.service';
import { Workflow, WorkflowRun, WorkflowSchedule, Webhook, WebhookLog } from './schema.mongodb';
import * as path from 'path';
import * as crypto from 'crypto';
import passport from './auth/passport.config';
import authRoutes from './auth/auth.routes';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app: Express = express();
const port = process.env.PORT || 3001;

// MongoDB service
const mongoService = MongoDBService.getInstance();

// Temporal client (initialize on startup)
let temporalClient: Client | null = null;

async function initTemporalClient() {
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });
    temporalClient = new Client({ connection });
    console.log('✅ Connected to Temporal Server');
  } catch (error) {
    console.warn('⚠️ Temporal Server không khả dụng - workflows sẽ không thực thi được');
    console.warn('💡 Bạn vẫn có thể sử dụng các chức năng khác của app');
    // Không throw error để app vẫn chạy được
  }
}

// Middleware
app.use(express.json());

// Passport middleware
app.use(passport.initialize());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Auth routes
app.use('/api/auth', authRoutes);

// In-memory storage (fallback if MongoDB fails)
const workflows = new Map();
const workflowRuns = new Map();

// Flag to check if using MongoDB
let usingMongoDB = false;

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Backend API is running' });
});

// Debug endpoint - Get workflow detail
app.get('/api/workflows/:workflowId/debug', (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  const nodes = workflow.reactFlowData?.nodes || [];
  const edges = workflow.reactFlowData?.edges || [];
  
  const errors = validateWorkflow(nodes, edges);
  const activities = convertWorkflowToTemporal(nodes, edges);
  
  res.json({
    workflow,
    validation: {
      errors,
      passed: errors.length === 0,
    },
    conversion: {
      activitiesCount: activities.length,
      activities,
    },
    nodes: {
      total: nodes.length,
      custom: nodes.filter((n: any) => n.type !== 'input' && n.type !== 'output').length,
      list: nodes.map((n: any) => ({ id: n.id, type: n.type, data: n.data })),
    },
    edges: {
      total: edges.length,
      list: edges.map((e: any) => ({ source: e.source, target: e.target })),
    },
  });
});

// Test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// ==================== WORKFLOW ROUTES ====================

// Get all workflows
app.get('/api/workflows', async (req: Request, res: Response) => {
  const { userId } = req.query;
  
  try {
    if (usingMongoDB) {
      const userWorkflows = await Workflow.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({
        success: true,
        total: userWorkflows.length,
        workflows: userWorkflows,
      });
    } else {
      const userWorkflows = Array.from(workflows.values())
        .filter((wf: any) => wf.userId === userId);
      return res.json({
        success: true,
        total: userWorkflows.length,
        workflows: userWorkflows,
      });
    }
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({ error: 'Failed to fetch workflows', message: error.message });
  }
});

// Create workflow
app.post('/api/workflows', async (req: Request, res: Response) => {
  const { userId, name, description, status, triggerType, reactFlowData } = req.body;
  
  try {
    if (usingMongoDB) {
      const workflow = new Workflow({
        userId,
        name,
        description,
        status: status || 'draft',
        triggerType: triggerType || 'MANUAL',
        reactFlowData,
        temporalConfig: [],
        isArchived: false,
      });
      
      await workflow.save();
      
      return res.status(201).json({
        success: true,
        workflow: workflow.toObject(),
      });
    } else {
      const workflowId = `wf-${Date.now()}`;
      const workflow = {
        _id: workflowId,
        userId,
        name,
        description,
        status: status || 'draft',
        triggerType: triggerType || 'MANUAL',
        reactFlowData,
        createdAt: new Date().toISOString(),
      };
      
      workflows.set(workflowId, workflow);
      
      return res.status(201).json({
        success: true,
        workflow,
      });
    }
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({ error: 'Failed to create workflow', message: error.message });
  }
});

// Update workflow
app.put('/api/workflows/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  
  try {
    if (usingMongoDB) {
      const workflow = await Workflow.findByIdAndUpdate(
        workflowId,
        { $set: req.body },
        { new: true }
      );
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      return res.json({
        success: true,
        workflow: workflow.toObject(),
      });
    } else {
      const workflow = workflows.get(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      const updated = { ...workflow, ...req.body };
      workflows.set(workflowId, updated);
      
      return res.json({
        success: true,
        workflow: updated,
      });
    }
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({ error: 'Failed to update workflow', message: error.message });
  }
});

// Delete workflow
app.delete('/api/workflows/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  
  try {
    if (usingMongoDB) {
      const workflow = await Workflow.findByIdAndDelete(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Cũng xóa các workflow runs liên quan
      await WorkflowRun.deleteMany({ workflowId });
      
      // Xóa các schedules liên quan
      await WorkflowSchedule.deleteMany({ workflowId });
      
      // Xóa các webhooks liên quan
      await Webhook.deleteMany({ workflowId });
      
      return res.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } else {
      const workflow = workflows.get(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      workflows.delete(workflowId);
      
      return res.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    }
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({ error: 'Failed to delete workflow', message: error.message });
  }
});

// Publish workflow
app.post('/api/workflows/:workflowId/publish', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  
  try {
    if (usingMongoDB) {
      const workflow = await Workflow.findByIdAndUpdate(
        workflowId,
        { $set: { status: 'published' } },
        { new: true }
      );
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      return res.json({
        success: true,
        message: 'Workflow published',
        workflow: workflow.toObject(),
      });
    } else {
      const workflow = workflows.get(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      workflow.status = 'published';
      workflows.set(workflowId, workflow);
      
      return res.json({
        success: true,
        message: 'Workflow published',
        workflow,
      });
    }
  } catch (error: any) {
    console.error('Error publishing workflow:', error);
    return res.status(500).json({ error: 'Failed to publish workflow', message: error.message });
  }
});

// Execute workflow
app.post('/api/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  
  console.log('📋 Execute request for workflow:', workflowId);
  
  try {
    let workflow: any = null;
    
    if (usingMongoDB) {
      workflow = await Workflow.findById(workflowId).lean();
    } else {
      workflow = workflows.get(workflowId);
    }
    
    console.log('📋 Workflow found:', !!workflow);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    console.log('📋 Workflow status:', workflow.status);
    console.log('📋 Workflow nodes:', workflow.reactFlowData?.nodes?.length || 0);
    console.log('📋 Workflow edges:', workflow.reactFlowData?.edges?.length || 0);
    
    if (workflow.status !== 'published') {
      return res.status(400).json({ error: 'Workflow must be published to execute' });
    }
    
    // Validate workflow
    const errors = validateWorkflow(
      workflow.reactFlowData?.nodes || [],
      workflow.reactFlowData?.edges || []
    );
    
    console.log('📋 Validation errors:', errors);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Workflow validation failed',
        validationErrors: errors,
      });
    }
    
    // Convert to Temporal activities
    const activities = convertWorkflowToTemporal(
      workflow.reactFlowData.nodes,
      workflow.reactFlowData.edges
    );
    
    if (activities.length === 0) {
      return res.status(400).json({
        error: 'Workflow has no executable activities',
      });
    }
    
    // Execute via Temporal
    const temporalWorkflowId = `workflow-${workflowId}-${Date.now()}`;
    
    let result: any = null;
    let status = 'RUNNING';
    let error = null;
    
    if (temporalClient) {
      try {
        const handle = await temporalClient.workflow.start('executeWorkflow', {
          taskQueue: 'workflow-queue',
          workflowId: temporalWorkflowId,
          args: [workflowId, activities],
        });
        
        console.log(`✅ Started Temporal workflow: ${temporalWorkflowId}`);
        
        // Save run to storage immediately với status RUNNING
        let savedRunId: string;
        
        if (usingMongoDB) {
          const run = new WorkflowRun({
            workflowId,
            temporalWorkflowId,
            temporalRunId: handle.workflowId,
            status: 'RUNNING',
            startTime: new Date(),
          });
          await run.save();
          savedRunId = run._id.toString();
          
          // Đợi workflow hoàn thành trong background để update status
          handle.result().then(
            (result) => {
              // Extract execution details nếu có
              const executionDetails = result?.__executionDetails || [];
              delete result?.__executionDetails; // Remove internal field
              
              WorkflowRun.findByIdAndUpdate(savedRunId, {
                status: 'SUCCESS',
                result,
                executionDetails,
                endTime: new Date(),
              }).then(() => {
                console.log(`✅ Workflow ${temporalWorkflowId} completed successfully`);
              }).catch(err => console.error('Error updating run status:', err));
            },
            (error) => {
              WorkflowRun.findByIdAndUpdate(savedRunId, {
                status: 'FAILURE',
                error: error.message,
                errorDetails: { message: error.message, stack: error.stack },
                endTime: new Date(),
              }).then(() => {
                console.log(`❌ Workflow ${temporalWorkflowId} failed: ${error.message}`);
              }).catch(err => console.error('Error updating run status:', err));
            }
          );
          
          return res.status(202).json({
            success: true,
            message: 'Workflow execution started',
            runId: savedRunId,
            temporalWorkflowId,
            status: 'RUNNING',
          });
        } else {
          const runId = `run-${Date.now()}`;
          const run = {
            _id: runId,
            workflowId,
            temporalWorkflowId,
            status: 'RUNNING',
            startTime: new Date().toISOString(),
          };
          workflowRuns.set(runId, run);
          
          return res.status(202).json({
            success: true,
            message: 'Workflow execution started',
            runId,
            temporalWorkflowId,
            status: 'RUNNING',
          });
        }
      } catch (err: any) {
        console.error('❌ Workflow execution failed:', err);
        status = 'FAILURE';
        error = err.message;
      }
    } else {
      // Fallback: Mock execution if Temporal not connected
      console.warn('⚠️  Temporal client not available, using mock execution');
      result = { mock: true, activities: activities.length };
      status = 'SUCCESS';
    }
    
    // Save run to storage
    if (usingMongoDB) {
      const run = new WorkflowRun({
        workflowId,
        temporalWorkflowId,
        temporalRunId: temporalWorkflowId,
        status,
        startTime: new Date(),
        endTime: new Date(),
        errorDetails: error ? { message: error } : undefined,
      });
      await run.save();
      
      return res.status(202).json({
        success: true,
        message: 'Workflow execution completed',
        runId: run._id,
        temporalWorkflowId,
        status,
        result,
        error,
      });
    } else {
      const runId = `run-${Date.now()}`;
      const run = {
        _id: runId,
        workflowId,
        temporalWorkflowId,
        status,
        error,
        result,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };
      workflowRuns.set(runId, run);
      
      return res.status(202).json({
        success: true,
        message: 'Workflow execution completed',
        runId,
        temporalWorkflowId,
        status,
        result,
        error,
      });
    }
  } catch (err: any) {
    console.error('Error executing workflow:', err);
    return res.status(500).json({
      error: 'Failed to execute workflow',
      message: err.message,
    });
  }
});

// Get workflow runs
app.get('/api/workflows/:workflowId/runs', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  
  try {
    if (usingMongoDB) {
      const runs = await WorkflowRun.find({ workflowId }).sort({ createdAt: -1 }).lean();
      return res.json({
        success: true,
        total: runs.length,
        runs,
      });
    } else {
      const runs = Array.from(workflowRuns.values())
        .filter((run: any) => run.workflowId === workflowId);
      return res.json({
        success: true,
        total: runs.length,
        runs,
      });
    }
  } catch (error: any) {
    console.error('Error fetching workflow runs:', error);
    return res.status(500).json({ error: 'Failed to fetch workflow runs', message: error.message });
  }
});

// Update run status (callback từ worker/temporal)
app.patch('/api/workflow-runs/:runId/status', async (req: Request, res: Response) => {
  const { runId } = req.params;
  const { status, result, error } = req.body;
  
  try {
    if (usingMongoDB) {
      const run = await WorkflowRun.findByIdAndUpdate(
        runId,
        {
          status,
          result,
          error,
          endTime: new Date(),
        },
        { new: true }
      );
      
      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }
      
      console.log(`✅ Updated run ${runId} status to ${status}`);
      return res.json({ success: true, run });
    } else {
      const run = workflowRuns.get(runId);
      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }
      
      (run as any).status = status;
      (run as any).result = result;
      (run as any).error = error;
      (run as any).endTime = new Date().toISOString();
      
      return res.json({ success: true, run });
    }
  } catch (error: any) {
    console.error('Error updating run status:', error);
    return res.status(500).json({ error: 'Failed to update status', message: error.message });
  }
});

// Get run detail
app.get('/api/workflow-runs/:runId', async (req: Request, res: Response) => {
  const { runId } = req.params;
  
  try {
    if (usingMongoDB) {
      const run = await WorkflowRun.findById(runId).lean();
      if (!run) {
        return res.status(404).json({ error: 'Workflow run not found' });
      }
      return res.json({
        success: true,
        run,
      });
    } else {
      const run = workflowRuns.get(runId);
      if (!run) {
        return res.status(404).json({ error: 'Workflow run not found' });
      }
      return res.json({
        success: true,
        run,
      });
    }
  } catch (error: any) {
    console.error('Error fetching workflow run:', error);
    return res.status(500).json({ error: 'Failed to fetch workflow run', message: error.message });
  }
});

// ==================== SCHEDULE MANAGEMENT ROUTES ====================

// Create a new schedule for a workflow
app.post('/api/workflows/:workflowId/schedules', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { name, description, cronExpression, timezone, triggerContext } = req.body;

  if (!temporalClient) {
    return res.status(503).json({ error: 'Temporal client not initialized' });
  }

  if (!name || !cronExpression) {
    return res.status(400).json({ error: 'Name and cronExpression are required' });
  }

  try {
    // Validate workflow exists
    let workflow;
    if (usingMongoDB) {
      workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
    } else {
      workflow = workflows.get(workflowId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
    }

    // Generate unique schedule ID
    const temporalScheduleId = `schedule-${workflowId}-${Date.now()}`;

    // Convert workflow to Temporal activities
    const nodes = workflow.reactFlowData?.nodes || [];
    const edges = workflow.reactFlowData?.edges || [];
    const activities = convertWorkflowToTemporal(nodes, edges);

    // Create schedule in Temporal
    const scheduleHandle = await temporalClient.schedule.create({
      scheduleId: temporalScheduleId,
      spec: {
        cronExpressions: [cronExpression],
        timezone: timezone || 'UTC',
      },
      action: {
        type: 'startWorkflow',
        workflowType: 'executeWorkflow',
        taskQueue: 'workflow-queue',
        args: [workflowId, activities],
        workflowId: `${workflowId}-scheduled-${Date.now()}`,
      },
      policies: {
        overlap: 'SKIP', // Skip if previous run is still running
        catchupWindow: '1 day', // Only catchup missed runs within 1 day
      },
    });

    console.log(`✅ Created Temporal schedule: ${temporalScheduleId}`);

    // Save schedule to MongoDB
    if (usingMongoDB) {
      const schedule = new WorkflowSchedule({
        workflowId,
        temporalScheduleId,
        name,
        description,
        cronExpression,
        timezone: timezone || 'UTC',
        isActive: true,
        triggerContext,
      });

      await schedule.save();

      return res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        schedule: {
          _id: schedule._id,
          workflowId: schedule.workflowId,
          temporalScheduleId: schedule.temporalScheduleId,
          name: schedule.name,
          description: schedule.description,
          cronExpression: schedule.cronExpression,
          timezone: schedule.timezone,
          isActive: schedule.isActive,
          createdAt: schedule.createdAt,
        },
      });
    } else {
      return res.status(501).json({
        error: 'Schedule persistence requires MongoDB',
        temporalScheduleId,
      });
    }
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return res.status(500).json({
      error: 'Failed to create schedule',
      message: error.message,
    });
  }
});

// Get all schedules for a workflow
app.get('/api/workflows/:workflowId/schedules', async (req: Request, res: Response) => {
  const { workflowId } = req.params;

  try {
    if (usingMongoDB) {
      const schedules = await WorkflowSchedule.find({ workflowId }).sort({ createdAt: -1 });
      return res.json({ schedules });
    } else {
      return res.status(501).json({ error: 'Schedule listing requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules', message: error.message });
  }
});

// Pause a schedule
app.post('/api/schedules/:scheduleId/pause', async (req: Request, res: Response) => {
  const { scheduleId } = req.params;

  if (!temporalClient) {
    return res.status(503).json({ error: 'Temporal client not initialized' });
  }

  try {
    if (usingMongoDB) {
      const schedule = await WorkflowSchedule.findById(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Pause in Temporal
      const scheduleHandle = temporalClient.schedule.getHandle(schedule.temporalScheduleId);
      await scheduleHandle.pause();

      // Update MongoDB
      schedule.isActive = false;
      await schedule.save();

      console.log(`⏸️  Paused schedule: ${schedule.temporalScheduleId}`);

      return res.json({
        success: true,
        message: 'Schedule paused',
        schedule,
      });
    } else {
      return res.status(501).json({ error: 'Schedule management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error pausing schedule:', error);
    return res.status(500).json({ error: 'Failed to pause schedule', message: error.message });
  }
});

// Resume a schedule
app.post('/api/schedules/:scheduleId/resume', async (req: Request, res: Response) => {
  const { scheduleId } = req.params;

  if (!temporalClient) {
    return res.status(503).json({ error: 'Temporal client not initialized' });
  }

  try {
    if (usingMongoDB) {
      const schedule = await WorkflowSchedule.findById(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Resume in Temporal
      const scheduleHandle = temporalClient.schedule.getHandle(schedule.temporalScheduleId);
      await scheduleHandle.unpause();

      // Update MongoDB
      schedule.isActive = true;
      await schedule.save();

      console.log(`▶️  Resumed schedule: ${schedule.temporalScheduleId}`);

      return res.json({
        success: true,
        message: 'Schedule resumed',
        schedule,
      });
    } else {
      return res.status(501).json({ error: 'Schedule management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error resuming schedule:', error);
    return res.status(500).json({ error: 'Failed to resume schedule', message: error.message });
  }
});

// Delete a schedule
app.delete('/api/schedules/:scheduleId', async (req: Request, res: Response) => {
  const { scheduleId } = req.params;

  if (!temporalClient) {
    return res.status(503).json({ error: 'Temporal client not initialized' });
  }

  try {
    if (usingMongoDB) {
      const schedule = await WorkflowSchedule.findById(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Delete from Temporal
      const scheduleHandle = temporalClient.schedule.getHandle(schedule.temporalScheduleId);
      await scheduleHandle.delete();

      // Delete from MongoDB
      await WorkflowSchedule.findByIdAndDelete(scheduleId);

      console.log(`🗑️  Deleted schedule: ${schedule.temporalScheduleId}`);

      return res.json({
        success: true,
        message: 'Schedule deleted',
      });
    } else {
      return res.status(501).json({ error: 'Schedule management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({ error: 'Failed to delete schedule', message: error.message });
  }
});

// ==================== WEBHOOK ENDPOINTS ====================

// Utility: Generate API Key
function generateApiKey(): string {
  return 'whk_' + crypto.randomBytes(32).toString('hex');
}

// Utility: Generate Secret for HMAC
function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Utility: Verify HMAC signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Create webhook for a workflow
app.post('/api/workflows/:workflowId/webhooks', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { name, description, enableSignature, allowedIPs, rateLimitPerMinute } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Webhook name is required' });
    }

    if (usingMongoDB) {
      // Check if workflow exists
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Generate API key and optional secret
      const apiKey = generateApiKey();
      const secret = enableSignature ? generateSecret() : undefined;

      const webhook = new Webhook({
        workflowId,
        name,
        description,
        apiKey,
        secret,
        isActive: true,
        allowedIPs: allowedIPs || [],
        rateLimitPerMinute: rateLimitPerMinute || 60,
        triggerCount: 0,
      });

      await webhook.save();

      console.log(`✅ Created webhook: ${webhook._id} for workflow ${workflowId}`);

      return res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        webhook: {
          id: webhook._id,
          name: webhook.name,
          description: webhook.description,
          apiKey: webhook.apiKey,
          secret: webhook.secret,
          isActive: webhook.isActive,
          webhookUrl: `${req.protocol}://${req.get('host')}/webhooks/${webhook.apiKey}`,
          allowedIPs: webhook.allowedIPs,
          rateLimitPerMinute: webhook.rateLimitPerMinute,
          createdAt: webhook.createdAt,
        },
      });
    } else {
      return res.status(501).json({ error: 'Webhook management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return res.status(500).json({ error: 'Failed to create webhook', message: error.message });
  }
});

// Get all webhooks for a workflow
app.get('/api/workflows/:workflowId/webhooks', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    if (usingMongoDB) {
      const webhooks = await Webhook.find({ workflowId }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        webhooks: webhooks.map((wh) => ({
          id: wh._id,
          name: wh.name,
          description: wh.description,
          apiKey: wh.apiKey,
          hasSecret: !!wh.secret,
          isActive: wh.isActive,
          webhookUrl: `${req.protocol}://${req.get('host')}/webhooks/${wh.apiKey}`,
          allowedIPs: wh.allowedIPs,
          rateLimitPerMinute: wh.rateLimitPerMinute,
          lastTriggeredAt: wh.lastTriggeredAt,
          triggerCount: wh.triggerCount,
          createdAt: wh.createdAt,
        })),
      });
    } else {
      return res.status(501).json({ error: 'Webhook management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return res.status(500).json({ error: 'Failed to fetch webhooks', message: error.message });
  }
});

// Delete webhook
app.delete('/api/webhooks/:webhookId', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    if (usingMongoDB) {
      const webhook = await Webhook.findByIdAndDelete(webhookId);

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(`✅ Deleted webhook: ${webhookId}`);

      return res.json({
        success: true,
        message: 'Webhook deleted',
      });
    } else {
      return res.status(501).json({ error: 'Webhook management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook', message: error.message });
  }
});

// Pause webhook
app.post('/api/webhooks/:webhookId/pause', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    if (usingMongoDB) {
      const webhook = await Webhook.findByIdAndUpdate(
        webhookId,
        { isActive: false },
        { new: true }
      );

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(`⏸️ Paused webhook: ${webhookId}`);

      return res.json({
        success: true,
        message: 'Webhook paused',
      });
    } else {
      return res.status(501).json({ error: 'Webhook management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error pausing webhook:', error);
    return res.status(500).json({ error: 'Failed to pause webhook', message: error.message });
  }
});

// Resume webhook
app.post('/api/webhooks/:webhookId/resume', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    if (usingMongoDB) {
      const webhook = await Webhook.findByIdAndUpdate(
        webhookId,
        { isActive: true },
        { new: true }
      );

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(`▶️ Resumed webhook: ${webhookId}`);

      return res.json({
        success: true,
        message: 'Webhook resumed',
      });
    } else {
      return res.status(501).json({ error: 'Webhook management requires MongoDB' });
    }
  } catch (error: any) {
    console.error('Error resuming webhook:', error);
    return res.status(500).json({ error: 'Failed to resume webhook', message: error.message });
  }
});

// Get webhook logs
app.get('/api/webhooks/:webhookId/logs', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (usingMongoDB) {
      const logs = await WebhookLog.find({ webhookId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return res.json({
        success: true,
        logs: logs.map((log) => ({
          id: log._id,
          webhookId: log.webhookId,
          workflowRunId: log.workflowRunId,
          requestMethod: log.requestMethod,
          requestHeaders: log.requestHeaders,
          requestBody: log.requestBody,
          requestIP: log.requestIP,
          responseStatus: log.responseStatus,
          responseBody: log.responseBody,
          errorMessage: log.errorMessage,
          duration: log.duration,
          createdAt: log.createdAt,
        })),
      });
    } else {
      return res.status(501).json({ error: 'Webhook logs require MongoDB' });
    }
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
  }
});

// ==================== PUBLIC WEBHOOK TRIGGER ENDPOINT ====================

// Rate limiting map: apiKey -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// GET webhook info (when someone opens URL in browser)
app.get('/webhooks/:apiKey', async (req: Request, res: Response) => {
  const { apiKey } = req.params;

  try {
    if (usingMongoDB) {
      const webhook = await Webhook.findOne({ apiKey }).populate('workflowId');

      if (!webhook) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Webhook Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; }
              h1 { color: #991b1b; margin: 0 0 10px 0; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Webhook không tồn tại</h1>
              <p>Webhook với API key này không được tìm thấy.</p>
            </div>
          </body>
          </html>
        `);
      }

      const workflow = webhook.workflowId as any;

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Webhook Info</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .info { background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; }
            .warning { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
            h1 { color: #065f46; margin: 0 0 10px 0; }
            .detail { margin: 10px 0; }
            .detail strong { display: inline-block; min-width: 150px; color: #374151; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .badge-active { background: #d1fae5; color: #065f46; }
            .badge-paused { background: #fee2e2; color: #991b1b; }
            .code { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 13px; overflow-x: auto; }
            pre { margin: 0; }
          </style>
        </head>
        <body>
          <div class="info">
            <h1>🪝 Webhook: ${webhook.name}</h1>
            ${webhook.description ? `<p>${webhook.description}</p>` : ''}
            
            <div class="detail">
              <strong>Workflow:</strong> ${workflow?.name || 'N/A'}
            </div>
            <div class="detail">
              <strong>Trạng thái:</strong> 
              ${webhook.isActive 
                ? '<span class="badge badge-active">🟢 Đang hoạt động</span>' 
                : '<span class="badge badge-paused">⏸️ Đã tạm dừng</span>'}
            </div>
            <div class="detail">
              <strong>Giới hạn tốc độ:</strong> ${webhook.rateLimitPerMinute} requests/phút
            </div>
            <div class="detail">
              <strong>Đã trigger:</strong> ${webhook.triggerCount} lần
            </div>
            ${webhook.lastTriggeredAt ? `
            <div class="detail">
              <strong>Lần cuối trigger:</strong> ${new Date(webhook.lastTriggeredAt).toLocaleString('vi-VN')}
            </div>
            ` : ''}
          </div>

          <div class="warning">
            <h3 style="margin: 0 0 10px 0;">⚠️ Không thể mở webhook URL trong trình duyệt</h3>
            <p>Webhook endpoint chỉ chấp nhận <strong>POST requests</strong>. Để trigger workflow, gửi POST request với payload JSON.</p>
          </div>

          <h3>📝 Cách sử dụng:</h3>
          <div class="code">
            <strong>cURL Example:</strong>
            <pre>curl -X POST ${req.protocol}://${req.get('host')}/webhooks/${apiKey} \\
  -H "Content-Type: application/json" \\
  ${webhook.secret ? `-H "X-Webhook-Signature: sha256=YOUR_SIGNATURE" \\\n  ` : ''}-d '{"event": "test", "data": "your payload here"}'</pre>
          </div>

          <div class="code">
            <strong>JavaScript/Fetch Example:</strong>
            <pre>fetch('${req.protocol}://${req.get('host')}/webhooks/${apiKey}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ${webhook.secret ? `'X-Webhook-Signature': 'sha256=YOUR_SIGNATURE',` : ''}
  },
  body: JSON.stringify({
    event: 'test',
    data: 'your payload here'
  })
});</pre>
          </div>

          ${webhook.secret ? `
          <div class="code">
            <strong>Generate HMAC Signature (Node.js):</strong>
            <pre>const crypto = require('crypto');
const payload = JSON.stringify({ event: 'test', data: 'your payload' });
const secret = 'YOUR_SECRET_KEY';
const signature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');</pre>
          </div>
          ` : ''}

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Quay lại <a href="${req.protocol}://${(req.get('host') || 'localhost:3001').replace(':3001', ':3000')}">Workflow Platform</a>
          </p>
        </body>
        </html>
      `);
    } else {
      return res.status(501).send('Webhook info requires MongoDB');
    }
  } catch (error: any) {
    console.error('Error fetching webhook info:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Webhook trigger endpoint (PUBLIC - no auth required except API key)
app.post('/webhooks/:apiKey', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { apiKey } = req.params;
  const requestIP = req.ip || req.connection.remoteAddress || 'unknown';
  const signature = req.headers['x-webhook-signature'] as string;

  try {
    if (usingMongoDB) {
      // Find webhook by API key
      const webhook = await Webhook.findOne({ apiKey });

      if (!webhook) {
        const duration = Date.now() - startTime;
        // Log failed attempt (optional)
        console.log(`❌ Webhook not found: ${apiKey} from ${requestIP}`);
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // Check if webhook is active
      if (!webhook.isActive) {
        const duration = Date.now() - startTime;
        await WebhookLog.create({
          webhookId: webhook._id,
          workflowId: webhook.workflowId,
          requestMethod: req.method,
          requestHeaders: req.headers,
          requestBody: req.body,
          requestIP,
          responseStatus: 403,
          responseBody: { error: 'Webhook is paused' },
          duration,
        });
        return res.status(403).json({ error: 'Webhook is paused' });
      }

      // Check IP whitelist
      if (webhook.allowedIPs && webhook.allowedIPs.length > 0) {
        if (!webhook.allowedIPs.includes(requestIP)) {
          const duration = Date.now() - startTime;
          await WebhookLog.create({
            webhookId: webhook._id,
            workflowId: webhook.workflowId,
            requestMethod: req.method,
            requestHeaders: req.headers,
            requestBody: req.body,
            requestIP,
            responseStatus: 403,
            responseBody: { error: 'IP not whitelisted' },
            duration,
          });
          return res.status(403).json({ error: 'IP not whitelisted' });
        }
      }

      // Rate limiting
      const now = Date.now();
      const rateLimitKey = apiKey;
      const rateLimit = rateLimitMap.get(rateLimitKey);
      const maxRequests = webhook.rateLimitPerMinute || 60;

      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          if (rateLimit.count >= maxRequests) {
            const duration = Date.now() - startTime;
            await WebhookLog.create({
              webhookId: webhook._id,
              workflowId: webhook.workflowId,
              requestMethod: req.method,
              requestHeaders: req.headers,
              requestBody: req.body,
              requestIP,
              responseStatus: 429,
              responseBody: { error: 'Rate limit exceeded' },
              duration,
            });
            return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
          }
          rateLimit.count++;
        } else {
          // Reset window
          rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
        }
      } else {
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }

      // Verify HMAC signature if secret exists
      if (webhook.secret) {
        if (!signature) {
          const duration = Date.now() - startTime;
          await WebhookLog.create({
            webhookId: webhook._id,
            workflowId: webhook.workflowId,
            requestMethod: req.method,
            requestHeaders: req.headers,
            requestBody: req.body,
            requestIP,
            responseStatus: 401,
            responseBody: { error: 'Missing signature' },
            duration,
          });
          return res.status(401).json({ error: 'Missing X-Webhook-Signature header' });
        }

        const payload = JSON.stringify(req.body);
        const isValid = verifySignature(payload, signature, webhook.secret);

        if (!isValid) {
          const duration = Date.now() - startTime;
          await WebhookLog.create({
            webhookId: webhook._id,
            workflowId: webhook.workflowId,
            requestMethod: req.method,
            requestHeaders: req.headers,
            requestBody: req.body,
            requestIP,
            responseStatus: 401,
            responseBody: { error: 'Invalid signature' },
            duration,
          });
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Get workflow
      const workflow = await Workflow.findById(webhook.workflowId);
      if (!workflow) {
        const duration = Date.now() - startTime;
        await WebhookLog.create({
          webhookId: webhook._id,
          workflowId: webhook.workflowId,
          requestMethod: req.method,
          requestHeaders: req.headers,
          requestBody: req.body,
          requestIP,
          responseStatus: 404,
          responseBody: { error: 'Workflow not found' },
          duration,
        });
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Check if workflow is published
      if (workflow.status !== 'published') {
        const duration = Date.now() - startTime;
        await WebhookLog.create({
          webhookId: webhook._id,
          workflowId: webhook.workflowId,
          requestMethod: req.method,
          requestHeaders: req.headers,
          requestBody: req.body,
          requestIP,
          responseStatus: 400,
          responseBody: { error: 'Workflow not published' },
          duration,
        });
        return res.status(400).json({ error: 'Workflow must be published to trigger via webhook' });
      }

      // Convert workflow to Temporal activities
      const nodes = workflow.reactFlowData?.nodes || [];
      const edges = workflow.reactFlowData?.edges || [];
      
      // 🔍 Debug: Kiểm tra edges có sourceHandle không
      console.log(`\n🔍 Workflow edges (${edges.length} total):`);
      edges.forEach((edge: any) => {
        console.log(`   ${edge.source} --[${edge.sourceHandle || 'none'}]--> ${edge.target}`);
      });
      
      // Prepare webhook data for template variables
      const webhookData = {
        webhook: req.body // Makes {{webhook.message.text}} work
      };
      
      // 📩 Log Telegram message
      if (req.body?.message) {
        console.log(`\n📩 New message from ${req.body.message.from?.first_name || 'Unknown'}:`);
        console.log(`   Text: "${req.body.message.text}"`);
        console.log(`   Chat ID: ${req.body.message.chat?.id}`);
      }
      
      const activities = convertWorkflowToTemporal(nodes, edges, webhookData);

      if (!temporalClient) {
        throw new Error('Temporal client not initialized');
      }

      // Start workflow with webhook payload as context
      const workflowId = `${workflow._id}-webhook-${Date.now()}`;
      const handle = await temporalClient.workflow.start('executeWorkflow', {
        taskQueue: 'workflow-queue',
        workflowId,
        args: [workflow._id.toString(), activities, webhookData], // Pass webhook data
      });

      console.log(`🚀 Webhook triggered workflow: ${workflowId}`);

      // Create WorkflowRun record
      const workflowRun = new WorkflowRun({
        workflowId: workflow._id,
        temporalWorkflowId: workflowId,
        temporalRunId: handle.firstExecutionRunId,
        status: 'RUNNING',
        startTime: new Date(),
        triggerType: 'webhook',
        triggerContext: {
          webhookId: webhook._id,
          requestIP,
          requestBody: req.body,
        },
      });

      await workflowRun.save();

      // Update webhook stats
      await Webhook.findByIdAndUpdate(webhook._id, {
        lastTriggeredAt: new Date(),
        $inc: { triggerCount: 1 },
      });

      // Create webhook log
      const duration = Date.now() - startTime;
      await WebhookLog.create({
        webhookId: webhook._id,
        workflowId: webhook.workflowId,
        workflowRunId: workflowRun._id,
        requestMethod: req.method,
        requestHeaders: req.headers,
        requestBody: req.body,
        requestIP,
        responseStatus: 200,
        responseBody: {
          success: true,
          workflowRunId: workflowRun._id,
          temporalWorkflowId: workflowId,
        },
        duration,
      });

      // Background: Update workflow run status
      (async () => {
        try {
          const result = await handle.result();
          await WorkflowRun.findByIdAndUpdate(workflowRun._id, {
            status: 'completed',
            endTime: new Date(),
            output: result,
          });
          console.log(`✅ Webhook workflow completed: ${workflowId}`);
        } catch (error: any) {
          await WorkflowRun.findByIdAndUpdate(workflowRun._id, {
            status: 'failed',
            endTime: new Date(),
            error: error.message,
          });
          console.error(`❌ Webhook workflow failed: ${workflowId}`, error);
        }
      })();

      return res.status(200).json({
        success: true,
        message: 'Workflow triggered successfully',
        workflowRunId: workflowRun._id,
        temporalWorkflowId: workflowId,
      });
    } else {
      return res.status(501).json({ error: 'Webhook triggers require MongoDB' });
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    const duration = Date.now() - startTime;
    
    if (usingMongoDB) {
      try {
        const webhook = await Webhook.findOne({ apiKey });
        if (webhook) {
          await WebhookLog.create({
            webhookId: webhook._id,
            workflowId: webhook.workflowId,
            requestMethod: req.method,
            requestHeaders: req.headers,
            requestBody: req.body,
            requestIP,
            responseStatus: 500,
            errorMessage: error.message,
            duration,
          });
        }
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }
    }

    return res.status(500).json({ error: 'Failed to process webhook', message: error.message });
  }
});

// ============================================
// ADMIN ROUTES (Quản trị)
// ============================================

// GET /api/admin/dashboard - Lấy thống kê tổng quan
app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    
    // Đếm users
    const totalUsers = await db.collection('users').countDocuments();
    const activeUsers = await db.collection('users').countDocuments({ isActive: true });
    
    // Đếm workflows
    const totalWorkflows = await db.collection('workflows').countDocuments();
    const activeWorkflows = await db.collection('workflows').countDocuments({ status: 'active' });
    
    // Đếm executions
    const totalExecutions = await db.collection('workflow_runs').countDocuments();
    const completedExecutions = await db.collection('workflow_runs').countDocuments({ status: 'completed' });
    const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0;
    
    // Tính growth (so với tháng trước - simplified)
    const userGrowth = 0; // TODO: Implement growth calculation
    const workflowGrowth = 0;
    const executionGrowth = 0;
    
    res.json({
      totalUsers,
      activeUsers,
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
      userGrowth,
      workflowGrowth,
      executionGrowth,
    });
  } catch (error: any) {
    console.error('❌ Error loading admin dashboard:', error);
    return res.status(500).json({ error: 'Failed to load dashboard', message: error.message });
  }
});

// GET /api/users - Lấy danh sách users (cho admin)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// GET /api/executions - Lấy danh sách executions (cho admin)
app.get('/api/executions', async (req: Request, res: Response) => {
  try {
    const db = mongoService.getDb();
    const executions = await db.collection('workflow_runs')
      .find({})
      .sort({ startedAt: -1 })
      .limit(100)
      .toArray();
    res.json(executions);
  } catch (error: any) {
    console.error('❌ Error fetching executions:', error);
    return res.status(500).json({ error: 'Failed to fetch executions', message: error.message });
  }
});

// Start server
app.listen(port, async () => {
  console.log(`✅ Backend API running on port ${port}`);
  console.log(`📡 Temporal Server: ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`);
  console.log(`💾 MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`\n🚀 Visit: http://localhost:${port}/health`);
  console.log(`📋 Workflow API: http://localhost:${port}/api/workflows`);
  
  // Initialize MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoService.connect({
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME || 'workflow-platform',
      });
      usingMongoDB = true;
      console.log('✅ Using MongoDB for data persistence');
      
      // Tạo tài khoản admin mặc định nếu chưa có
      const db = mongoService.getDb();
      const adminEmail = 'admin@workflow.com';
      const adminExists = await db.collection('users').findOne({ email: adminEmail });
      
      if (!adminExists) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await db.collection('users').insertOne({
          email: adminEmail,
          name: 'Administrator',
          password: hashedPassword,
          role: 'admin',
          provider: 'local',
          isActive: true,
          createdAt: new Date(),
        });
        
        console.log('👤 Tạo tài khoản admin mặc định:');
        console.log('   📧 Email: admin@workflow.com');
        console.log('   🔑 Password: admin123');
        console.log('   ⚠️  Hãy đổi mật khẩu sau khi đăng nhập!');
      } else {
        // Đảm bảo admin có role admin
        await db.collection('users').updateOne(
          { email: adminEmail },
          { $set: { role: 'admin' } }
        );
        console.log('✅ Tài khoản admin đã tồn tại');
      }
      
    } catch (error) {
      console.error('❌ MongoDB connection failed, using in-memory storage');
      usingMongoDB = false;
    }
  } else {
    console.log('⚠️  No MongoDB URI configured, using in-memory storage');
  }
  
  // Initialize Temporal client
  await initTemporalClient();
});

export default app;

const { Connection, WorkflowClient } = require('@temporalio/client');

async function terminateAllWorkflows() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new WorkflowClient({ connection });
  
  try {
    console.log('🔍 Listing all workflows...\n');
    
    const handle = client.getHandle('693ba5dcbb9af2ecdcaa674a-webhook-1765521995560');
    await handle.terminate('Forcing config reload');
    console.log('✅ Terminated workflow');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

terminateAllWorkflows();

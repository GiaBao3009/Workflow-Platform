const { Connection, WorkflowClient } = require('@temporalio/client');

async function terminateAllRunning() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new WorkflowClient({ connection });
  
  try {
    console.log('🔍 Listing and terminating ALL running workflows...\n');
    
    // List all running workflows
    const workflowsIter = client.list({
      query: 'ExecutionStatus="Running"'
    });
    
    let count = 0;
    for await (const workflow of workflowsIter) {
      console.log(`Terminating: ${workflow.workflowId}`);
      try {
        const handle = client.getHandle(workflow.workflowId);
        await handle.terminate('Force terminate - API key updated');
        count++;
      } catch (err) {
        console.log(`  ⚠️  Failed: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Terminated ${count} workflows`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

terminateAllRunning();

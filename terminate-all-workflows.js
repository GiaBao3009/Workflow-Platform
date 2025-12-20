const { Connection, Client } = require('@temporalio/client');

async function terminateAll() {
  try {
    console.log('🔌 Connecting to Temporal...\n');
    
    const connection = await Connection.connect({
      address: 'localhost:7233',
    });
    
    const client = new Client({ connection });
    
    console.log('🗑️  Terminating ALL workflows for 693ba5dcbb9af2ecdcaa674a...\n');
    
    // List all workflows
    const listHandle = client.workflow.list({
      query: 'WorkflowId STARTS_WITH "693ba5dcbb9af2ecdcaa674a"',
    });
    
    let count = 0;
    for await (const workflow of listHandle) {
      try {
        const handle = client.workflow.getHandle(workflow.workflowId);
        await handle.terminate('Cleanup all old workflows');
        console.log(`✅ Terminated: ${workflow.workflowId}`);
        count++;
      } catch (error) {
        if (!error.message.includes('not found')) {
          console.log(`❌ Error: ${workflow.workflowId} - ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Terminated ${count} workflows!`);
    console.log('💡 Now send a NEW message to bot to test');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

terminateAll();

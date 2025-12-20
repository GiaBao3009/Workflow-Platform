const { Connection, Client } = require('@temporalio/client');

async function terminateWorkflows() {
  try {
    console.log('🔌 Connecting to Temporal...\n');
    
    const connection = await Connection.connect({
      address: 'localhost:7233',
    });
    
    const client = new Client({ connection });
    
    // List all workflows for the specific workflow ID
    const workflowPrefix = '693ba5dcbb9af2ecdcaa674a-webhook-';
    
    console.log(`🔍 Finding workflows starting with: ${workflowPrefix}\n`);
    
    // Terminate workflows with the old range issue
    const workflowIds = [
      '693ba5dcbb9af2ecdcaa674a-webhook-1766131550841',
      '693ba5dcbb9af2ecdcaa674a-webhook-1766132205867',
      '693ba5dcbb9af2ecdcaa674a-webhook-1766127519337',
      '693ba5dcbb9af2ecdcaa674a-webhook-1766127043179',
      '693ba5dcbb9af2ecdcaa674a-webhook-1766128362487',
      '693ba5dcbb9af2ecdcaa674a-webhook-1766133410747',
    ];
    
    for (const workflowId of workflowIds) {
      try {
        const handle = client.workflow.getHandle(workflowId);
        await handle.terminate('Terminating old workflow with incorrect Sheets range config');
        console.log(`✅ Terminated: ${workflowId}`);
      } catch (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️  Not found: ${workflowId}`);
        } else {
          console.log(`❌ Error terminating ${workflowId}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ All old workflows terminated!');
    console.log('💡 New messages will use the updated config (A1:F)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

terminateWorkflows();

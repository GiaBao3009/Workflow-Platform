const { Connection, Client } = require('@temporalio/client');

async function terminateOldWorkflow() {
  try {
    console.log('🔌 Connecting to Temporal...');
    const connection = await Connection.connect({
      address: 'localhost:7233',
    });
    const client = new Client({ connection });
    console.log('✅ Connected!');
    
    // Terminate old workflow
    const oldWorkflowId = '692c76afb5dcf9edd01e9547-webhook-1764806004028';
    console.log(`\n🛑 Terminating workflow: ${oldWorkflowId}`);
    
    const handle = client.workflow.getHandle(oldWorkflowId);
    await handle.terminate('Workflow definition outdated - using new workflow');
    
    console.log('✅ Old workflow terminated!');
    console.log('\n📋 Next step:');
    console.log('   Send a message to Telegram bot');
    console.log('   → It will trigger NEW workflow: 693ba5dcbb9af2ecdcaa674a');
    
  } catch (error) {
    if (error.message.includes('not found')) {
      console.log('✅ Workflow already terminated or not found');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

terminateOldWorkflow();

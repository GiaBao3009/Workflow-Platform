const { Connection, WorkflowClient } = require('@temporalio/client');

async function cleanup() {
  console.log('🧹 Starting cleanup...');
  
  // Terminate Temporal workflows
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new WorkflowClient({ connection });
  
  const workflowIds = [
    '692c76afb5dcf9edd01e9547-webhook-1764807960743',
    '692c76afb5dcf9edd01e9547-webhook-1764807230157',
    '692c76afb5dcf9edd01e9547-webhook-1764797079406',
    '692c76afb5dcf9edd01e9547-webhook-1764795512543',
    '692c76afb5dcf9edd01e9547-webhook-1764794120286',
    '692c76afb5dcf9edd01e9547-webhook-1764768715427',
    '692c76afb5dcf9edd01e9547-webhook-1764765021568',
    '692c76afb5dcf9edd01e9547-webhook-1764522278163',
    '6929c59ba1641d9ee7c7d842-webhook-1764519212757',
    '6929c59ba1641d9ee7c7d842-webhook-1764513324265',
    '6929c59ba1641d9ee7c7d842-webhook-1764513276784',
    '692c3b4a209df611f75d5a7f-webhook-1764519809393'
  ];
  
  let terminated = 0;
  for (const wfId of workflowIds) {
    try {
      const handle = client.getHandle(wfId);
      await handle.terminate('Cleanup old failed workflows');
      terminated++;
      console.log(`✅ Terminated: ${wfId}`);
    } catch (e) {
      console.log(`⏭️  Skip: ${wfId} (${e.message})`);
    }
  }
  
  console.log(`\n✅ Temporal: Terminated ${terminated} workflows`);
  console.log('🎉 Cleanup complete! Now restart backend and send a new Telegram message.');
  
  process.exit(0);
}

cleanup().catch(console.error);

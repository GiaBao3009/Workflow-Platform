const { MongoClient } = require('mongodb');

async function checkWorkflow() {
  const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('workflow-db');
    const workflows = db.collection('workflows');
    
    // Count workflows
    const count = await workflows.countDocuments();
    console.log(`📊 Total workflows: ${count}`);
    
    // Find Telegram bot workflow
    const workflow = await workflows.findOne({}, { 
      sort: { updatedAt: -1 } // Get latest workflow
    });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }
    
    console.log('✅ Found workflow:', workflow.name);
    console.log('\n📊 Edges:');
    
    const edges = workflow.reactFlowData?.edges || [];
    edges.forEach(edge => {
      console.log(`   ${edge.source}`);
      console.log(`   --[sourceHandle: ${edge.sourceHandle || 'MISSING'}]-->`);
      console.log(`   ${edge.target}\n`);
    });
    
    const hasSourceHandle = edges.some(e => e.sourceHandle);
    
    if (!hasSourceHandle) {
      console.log('❌ PROBLEM: Edges do NOT have sourceHandle!');
      console.log('\n💡 SOLUTION: You need to REDRAW the workflow connections in UI:');
      console.log('   1. Open http://localhost:5173');
      console.log('   2. Delete edges from ContentFilter');
      console.log('   3. Reconnect:');
      console.log('      - LEFT handle (pass) → Gemini → Telegram');
      console.log('      - RIGHT handle (reject) → Telegram warning');
    } else {
      console.log('✅ Edges have sourceHandle - good!');
    }
    
  } finally {
    await client.close();
  }
}

checkWorkflow();

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkWorkflow() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('workflow-platform');
    const workflow = await db.collection('workflows').findOne(
      { _id: '693ba5dcbb9af2ecdcaa674a' }
    );
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }
    
    console.log('\n📋 Workflow:', workflow.name);
    console.log('🔧 Trigger Type:', workflow.triggerType);
    
    const nodes = JSON.parse(workflow.reactFlowData).nodes;
    console.log('\n📦 NODES:');
    nodes.forEach(node => {
      console.log(`  - ${node.id}: type="${node.type}" (${node.data?.label || 'no label'})`);
      if (node.type === 'gemini' || node.type === 'http') {
        console.log('    Config:', JSON.stringify(node.data?.config || {}, null, 2));
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkWorkflow();

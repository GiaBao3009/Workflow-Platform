const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function inspectWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-db');
    
    // Try both ObjectId and string
    let workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    if (!workflow) {
      workflow = await db.collection('workflows').findOne({ _id: WORKFLOW_ID });
    }
    
    if (!workflow) {
      console.log('Workflow not found!');
      return;
    }
    
    console.log(`\n📋 Workflow: ${workflow.name}`);
    console.log(`User: ${workflow.userId}`);
    console.log(`Status: ${workflow.status}`);
    console.log(`\n🔧 Nodes (${workflow.nodes.length}):`);
    
    workflow.nodes.forEach((node, i) => {
      console.log(`\n${i + 1}. ${node.type} (${node.id})`);
      if (node.config) {
        console.log(`   Config keys:`, Object.keys(node.config));
        
        // Check for API key
        if (node.config.apiKey) {
          console.log(`   ⚠️  Has apiKey: ${node.config.apiKey.substring(0, 20)}...`);
        }
        if (node.config.model) {
          console.log(`   Model: ${node.config.model}`);
        }
      }
    });
    
  } finally {
    await client.close();
  }
}

inspectWorkflow();

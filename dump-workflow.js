const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function dumpWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log('\n📋 Full Workflow Structure:\n');
    console.log(JSON.stringify(workflow, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

dumpWorkflow();

// Fix workflow model: gemini-pro -> gemini-2.5-flash
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function fixWorkflowModel() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    const workflows = db.collection('workflows');
    
    console.log(`🔧 Fixing workflow ${WORKFLOW_ID}...\n`);
    
    // Get current workflow - try both string ID and ObjectId
    let workflow = await workflows.findOne({ _id: WORKFLOW_ID });
    if (!workflow) {
      workflow = await workflows.findOne({ _id: new ObjectId(WORKFLOW_ID) });
    }
    if (!workflow) {
      console.error('❌ Workflow not found!');
      return;
    }
    
    console.log(`📋 Workflow: ${workflow.name}`);
    console.log(`📊 Total nodes: ${workflow.reactFlowData.nodes.length}\n`);
    
    // Update all GEMINI nodes
    let updatedCount = 0;
    workflow.reactFlowData.nodes.forEach(node => {
      if (node.type === 'gemini') {
        console.log(`✏️  Updating node: ${node.id}`);
        const oldModel = node.data.model || 'undefined (will use default gemini-pro)';
        console.log(`   Old model: ${oldModel}`);
        node.data.model = 'gemini-2.0-flash-exp';
        console.log(`   New model: ${node.data.model}\n`);
        updatedCount++;
      }
    });
    
    if (updatedCount === 0) {
      console.log('✅ No gemini nodes found.');
      return;
    }
    
    // Save to MongoDB
    const updateId = workflow._id instanceof ObjectId ? workflow._id : new ObjectId(WORKFLOW_ID);
    const result = await workflows.updateOne(
      { _id: updateId },
      { 
        $set: { 
          reactFlowData: workflow.reactFlowData,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Updated ${updatedCount} nodes in MongoDB!`);
    console.log(`📝 Modified count: ${result.modifiedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixWorkflowModel();

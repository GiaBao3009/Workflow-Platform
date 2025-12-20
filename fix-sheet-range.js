const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function fixSheetRange() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log(`\n📋 Fixing workflow: ${workflow.name}\n`);
    
    // Find Google Sheets node
    const sheetsNodeIndex = workflow.reactFlowData.nodes.findIndex(
      n => n.type === 'googleSheets'
    );
    
    if (sheetsNodeIndex === -1) {
      console.log('❌ No Google Sheets node found!');
      return;
    }
    
    const sheetsNode = workflow.reactFlowData.nodes[sheetsNodeIndex];
    console.log(`📊 Current config:`);
    console.log(`   sheetName: "${sheetsNode.data.sheetName}"`);
    console.log(`   range: "${sheetsNode.data.range}"`);
    console.log(`   Combined: "${sheetsNode.data.sheetName}!${sheetsNode.data.range}"`);
    
    // Fix range format
    console.log(`\n🔧 Fixing range format...`);
    workflow.reactFlowData.nodes[sheetsNodeIndex].data.range = 'A1:F';
    
    console.log(`\n✅ New config:`);
    console.log(`   sheetName: "${sheetsNode.data.sheetName}"`);
    console.log(`   range: "A1:F"`);
    console.log(`   Combined: "${sheetsNode.data.sheetName}!A1:F"`);
    
    // Update workflow
    await db.collection('workflows').updateOne(
      { _id: new ObjectId(WORKFLOW_ID) },
      { 
        $set: { 
          reactFlowData: workflow.reactFlowData,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`\n✅ Workflow updated successfully!`);
    console.log(`\n💡 Restart worker to load new config.`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

fixSheetRange();

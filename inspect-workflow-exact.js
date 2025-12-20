const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function inspect() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    const workflow = await db.collection('workflows').findOne({
      _id: new ObjectId('693ba5dcbb9af2ecdcaa674a')
    });
    
    if (!workflow) {
      console.log('❌ Workflow not found in workflow-platform database');
      return;
    }
    
    console.log('✅ Found workflow:', workflow.name);
    console.log('Trigger:', workflow.triggerType);
    
    const dataStr = typeof workflow.reactFlowData === 'string' 
      ? workflow.reactFlowData 
      : JSON.stringify(workflow.reactFlowData);
    const flowData = JSON.parse(dataStr);
    
    console.log('\n📦 NODES:');
    flowData.nodes.forEach(node => {
      console.log(`\n   ${node.id}:`);
      console.log(`      type: ${node.type}`);
      console.log(`      label: ${node.data?.label}`);
      if (node.data?.config) {
        console.log(`      config:`, JSON.stringify(node.data.config, null, 8));
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

inspect();

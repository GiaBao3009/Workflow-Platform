const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findWorkflow() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    const workflows = await db.collection('workflows').find({
      name: { $regex: 'tele', $options: 'i' }
    }).toArray();
    
    console.log(`\n🔍 Found ${workflows.length} workflows:\n`);
    
    workflows.forEach(w => {
      console.log(`📋 ${w.name}`);
      console.log(`   ID: ${w._id}`);
      console.log(`   Trigger: ${w.triggerType}`);
      
      if (w.reactFlowData) {
        try {
          const dataStr = typeof w.reactFlowData === 'string' 
            ? w.reactFlowData 
            : JSON.stringify(w.reactFlowData);
          const data = JSON.parse(dataStr);
          const geminiNode = data.nodes.find(n => n.type === 'gemini' || n.type === 'http');
          if (geminiNode) {
            console.log(`   AI Node: ${geminiNode.id} (type: ${geminiNode.type})`);
          }
        } catch (e) {
          console.log(`   ⚠️ Cannot parse reactFlowData: ${e.message}`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

findWorkflow();

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixWorkflow() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('workflow-platform');
    const workflowId = '693ba5dcbb9af2ecdcaa674a';
    
    // Get workflow
    const workflow = await db.collection('workflows').findOne({
      _id: new ObjectId(workflowId)
    });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }
    
    console.log('📋 Found:', workflow.name);
    
    // Parse reactFlowData
    const dataStr = typeof workflow.reactFlowData === 'string' 
      ? workflow.reactFlowData 
      : JSON.stringify(workflow.reactFlowData);
    const flowData = JSON.parse(dataStr);
    
    // Find and update Gemini node
    let geminiNode = flowData.nodes.find(n => n.data?.label === 'Gemini AI');
    if (!geminiNode) {
      geminiNode = flowData.nodes.find(n => n.type === 'gemini');
    }
    
    if (!geminiNode) {
      console.log('❌ No Gemini node found');
      console.log('Available nodes:', flowData.nodes.map(n => `${n.id} (${n.type})`));
      return;
    }
    
    console.log(`\n🔧 Found Gemini node: ${geminiNode.id}`);
    console.log(`   Current type: ${geminiNode.type}`);
    
    // Change to static response type
    geminiNode.type = 'static';
    geminiNode.data.config = {
      response: JSON.stringify({
        is_feedback: false,
        response: "Xin chào! Đây là tin nhắn test tự động. Bot đang hoạt động!"
      })
    };
    
    // Update workflow
    await db.collection('workflows').updateOne(
      { _id: new ObjectId(workflowId) },
      { $set: { reactFlowData: JSON.stringify(flowData) } }
    );
    
    console.log('\n✅ Updated workflow!');
    console.log('   Changed node to type: static');
    console.log('   Static response: Test message');
    console.log('\n📌 Next steps:');
    console.log('   1. Restart worker: cd hello-temporal && node dist\\worker.js');
    console.log('   2. Test Telegram bot');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixWorkflow();

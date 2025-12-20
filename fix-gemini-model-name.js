const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-platform';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function fixGeminiModel() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('🔧 FIXING GEMINI MODEL NAME\n');
    
    // Get workflow
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }
    
    // Find Gemini node
    const geminiNode = workflow.reactFlowData.nodes.find(n => n.type === 'gemini');
    
    if (!geminiNode) {
      console.log('❌ No Gemini node found in workflow');
      return;
    }
    
    console.log('📋 Current Gemini config:');
    console.log('   Model:', geminiNode.data.model || '(not set - using default)');
    console.log('   Label:', geminiNode.data.label);
    
    // Update model to new version
    geminiNode.data.model = 'gemini-2.5-flash';
    
    // Update workflow in database
    await db.collection('workflows').updateOne(
      { _id: new ObjectId(WORKFLOW_ID) },
      { $set: { 
        'reactFlowData.nodes': workflow.reactFlowData.nodes,
        updatedAt: new Date()
      }}
    );
    
    console.log('\n✅ Updated Gemini model to: gemini-2.5-flash');
    console.log('\n==================================================================');
    console.log('✅ FIX COMPLETE!');
    console.log('==================================================================\n');
    console.log('📝 NEXT STEPS:');
    console.log('   1. Restart worker: cd hello-temporal && node dist\\worker.js');
    console.log('   2. Test với Telegram bot');
    console.log('   3. Nếu vẫn lỗi key → Tạo key mới:');
    console.log('      https://aistudio.google.com/app/apikey');
    console.log('      node update-gemini-key.js YOUR_NEW_KEY\n');
    console.log('==================================================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixGeminiModel();

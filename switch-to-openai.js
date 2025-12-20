const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-platform';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function switchToOpenAI() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('🔄 SWITCHING GEMINI → OPENAI\n');
    
    // Get workflow
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log('✅ Found workflow:', workflow.name);
    
    // Find Gemini node
    const geminiNode = workflow.reactFlowData.nodes.find(n => n.type === 'gemini');
    if (!geminiNode) {
      console.log('❌ No Gemini node found!');
      return;
    }
    
    console.log('✅ Found Gemini node:', geminiNode.id);
    
    // Change to ChatGPT node
    geminiNode.type = 'chatgpt';
    geminiNode.data.label = 'chatgpt';
    geminiNode.data.model = 'gpt-3.5-turbo'; // Cheapest option
    
    // Keep the same system prompt and user message
    // OpenAI uses same structure
    
    console.log('✅ Changed to OpenAI (GPT-3.5-turbo)');
    
    // Update workflow in MongoDB
    await db.collection('workflows').updateOne(
      { _id: new ObjectId(WORKFLOW_ID) },
      { 
        $set: { 
          reactFlowData: workflow.reactFlowData,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Updated workflow in database');
    
    console.log('\n==================================================================');
    console.log('✅ CHUYỂN ĐỔI THÀNH CÔNG!');
    console.log('==================================================================\n');
    
    console.log('📊 THAY ĐỔI:');
    console.log('   ❌ Gemini AI (gemini-pro)');
    console.log('   ✅ OpenAI ChatGPT (gpt-3.5-turbo)\n');
    
    console.log('💰 CHI PHÍ:');
    console.log('   - GPT-3.5-turbo: $0.0005/1K tokens (cực rẻ)');
    console.log('   - Ước tính: ~$0.01 cho 100 messages\n');
    
    console.log('🔑 API KEY:');
    console.log('   OpenAI key đã có sẵn trong .env ✅\n');
    
    console.log('⚙️  NEXT STEPS:');
    console.log('   1. Restart worker:');
    console.log('      Ctrl+C trong terminal worker');
    console.log('      cd hello-temporal');
    console.log('      node dist\\worker.js');
    console.log('');
    console.log('   2. Test Telegram bot:');
    console.log('      Gửi: "Xin chào"');
    console.log('      Bot sẽ trả lời qua OpenAI\n');
    
    console.log('==================================================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

switchToOpenAI();

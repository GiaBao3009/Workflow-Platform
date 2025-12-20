const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-platform';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function createMockAIWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('🎭 CREATING MOCK AI WORKFLOW (NO GEMINI NEEDED)\n');
    
    // Get workflow
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log('✅ Found workflow:', workflow.name);
    
    // Find and modify Gemini node
    const geminiNodeIndex = workflow.reactFlowData.nodes.findIndex(n => n.type === 'gemini');
    if (geminiNodeIndex === -1) {
      console.log('❌ No Gemini node found!');
      return;
    }
    
    const geminiNode = workflow.reactFlowData.nodes[geminiNodeIndex];
    console.log('✅ Found Gemini node:', geminiNode.id);
    
    // Replace with mock response node (http node with static response)
    workflow.reactFlowData.nodes[geminiNodeIndex] = {
      ...geminiNode,
      type: 'http',
      data: {
        ...geminiNode.data,
        label: 'Mock AI Response',
        method: 'POST',
        url: 'https://httpbin.org/post',
        body: JSON.stringify({
          is_feedback: false,
          response: 'Xin chào! Tôi là bot tự động. Hãy gửi feedback như "Tôi đánh giá 9 điểm" để test Google Sheets.'
        })
      }
    };
    
    console.log('✅ Replaced Gemini with Mock Response');
    
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
    
    console.log('✅ Updated workflow in database');
    
    console.log('\n==================================================================');
    console.log('✅ MOCK WORKFLOW TẠO THÀNH CÔNG!');
    console.log('==================================================================\n');
    
    console.log('🎭 WORKFLOW MỚI:');
    console.log('   1. Telegram → Webhook');
    console.log('   2. Mock AI Response (không cần Gemini)');
    console.log('   3. Content Filter');
    console.log('   4. Google Sheets (TEST ĐƯỢC!)');
    console.log('   5. Telegram Reply\n');
    
    console.log('🧪 TEST:');
    console.log('   1. Gửi tin nhắn bất kỳ → Bot reply mock message');
    console.log('   2. Gửi: "Tôi đánh giá 9 điểm" → Lưu vào Google Sheets\n');
    
    console.log('⚙️  NEXT STEPS:');
    console.log('   1. Restart worker');
    console.log('   2. Test Telegram bot');
    console.log('   3. Verify Google Sheets có data\n');
    
    console.log('==================================================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createMockAIWorkflow();

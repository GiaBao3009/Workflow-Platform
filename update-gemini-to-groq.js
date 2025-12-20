/**
 * Script: Chuyển đổi node Gemini AI sang Groq AI
 * 
 * Cách dùng:
 * node update-gemini-to-groq.js <workflow_id>
 * 
 * Ví dụ:
 * node update-gemini-to-groq.js 693ba5dcbb9af2ecdcaa674a
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workflow-platform';

async function updateGeminiToGroq(workflowId) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('workflows');
    
    // Lấy workflow
    const workflow = await collection.findOne({ _id: workflowId });
    
    if (!workflow) {
      console.error(`❌ Không tìm thấy workflow với ID: ${workflowId}`);
      return;
    }
    
    console.log(`\n📋 Workflow: ${workflow.name || 'Untitled'}`);
    console.log(`📊 Tổng số nodes: ${workflow.reactFlowData?.nodes?.length || 0}`);
    
    // Tìm tất cả Gemini nodes
    const geminiNodes = workflow.reactFlowData?.nodes?.filter(
      node => node.type === 'gemini'
    ) || [];
    
    if (geminiNodes.length === 0) {
      console.log('\n⚠️ Không tìm thấy node Gemini AI nào trong workflow này');
      return;
    }
    
    console.log(`\n🔍 Tìm thấy ${geminiNodes.length} node(s) Gemini AI:\n`);
    
    // Hiển thị thông tin các Gemini nodes
    geminiNodes.forEach((node, index) => {
      console.log(`  ${index + 1}. Node ID: ${node.id}`);
      console.log(`     Model: ${node.data?.model || 'gemini-pro'}`);
      console.log(`     System Prompt: ${node.data?.systemPrompt ? '✓' : '✗'}`);
      console.log(`     User Message: ${node.data?.userMessage || 'Chưa cấu hình'}`);
      console.log('');
    });
    
    // Chuyển đổi tất cả Gemini nodes sang Groq
    const updatedNodes = workflow.reactFlowData.nodes.map(node => {
      if (node.type === 'gemini') {
        console.log(`🔄 Converting ${node.id}: gemini → groq`);
        
        // Map Gemini model sang Groq model
        let groqModel = 'llama-3.3-70b-versatile';
        if (node.data?.model === 'gemini-pro') {
          groqModel = 'llama-3.3-70b-versatile';
        } else if (node.data?.model === 'gemini-1.5-pro') {
          groqModel = 'llama-3.3-70b-versatile';
        } else if (node.data?.model === 'gemini-1.5-flash') {
          groqModel = 'mixtral-8x7b-32768';
        }
        
        return {
          ...node,
          type: 'groq',  // ⚡ Đổi type
          data: {
            ...node.data,
            model: groqModel,  // Đổi model
            // Giữ nguyên các config khác
            systemPrompt: node.data?.systemPrompt || '',
            userMessage: node.data?.userMessage || '',
            maxTokens: node.data?.maxTokens || 2048,
            temperature: node.data?.temperature || 0.7,
            // Thêm conversation history (tùy chọn)
            useConversationHistory: true,
            chatId: node.data?.chatId || '{{webhook.message.chat.id}}'
          }
        };
      }
      return node;
    });
    
    // Update workflow
    const result = await collection.updateOne(
      { _id: workflowId },
      { 
        $set: { 
          'reactFlowData.nodes': updatedNodes,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ CẬP NHẬT THÀNH CÔNG!');
      console.log('\n📝 Thay đổi:');
      console.log(`   • ${geminiNodes.length} node(s) Gemini AI → Groq AI`);
      console.log('   • Model: gemini-pro → llama-3.3-70b-versatile');
      console.log('   • Conversation History: Enabled');
      console.log('   • Giữ nguyên System Prompt, User Message, Temperature');
      
      console.log('\n🚀 Bước tiếp theo:');
      console.log('   1. Restart backend: cd apps/backend-api && npm run dev');
      console.log('   2. Restart worker: cd hello-temporal && npm run dev');
      console.log('   3. Test bot trên Telegram');
      
      console.log('\n💡 Lợi ích khi dùng Groq:');
      console.log('   ✅ MIỄN PHÍ: 14,400 requests/day');
      console.log('   ✅ CỰC NHANH: < 1 giây');
      console.log('   ✅ Nhớ lịch sử chat (conversation history)');
      console.log('   ✅ Llama 3.3 70B - model cực mạnh\n');
    } else {
      console.log('\n⚠️ Không có thay đổi nào được thực hiện');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await client.close();
  }
}

// Main
const workflowId = process.argv[2];

if (!workflowId) {
  console.log(`
📚 Cách sử dụng:
   node update-gemini-to-groq.js <workflow_id>

📋 Ví dụ:
   node update-gemini-to-groq.js 693ba5dcbb9af2ecdcaa674a

🔍 Để xem danh sách workflows:
   node list-workflows.js
  `);
  process.exit(1);
}

console.log('⚡ CHUYỂN ĐỔI GEMINI AI → GROQ AI\n');
updateGeminiToGroq(workflowId);

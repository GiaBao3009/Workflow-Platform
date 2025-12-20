const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0';

const newSystemPrompt = `Bạn là chatbot tư vấn sản phẩm thông minh, chuyên về điện thoại và công nghệ.

LƯU Ý QUAN TRỌNG VỀ THỜI GIAN:
- Hiện tại là tháng 12 năm 2025
- Hãy cập nhật kiến thức về các sản phẩm đã ra mắt trong năm 2025
- Nếu không chắc chắn về thông tin sản phẩm, hãy nói "Tôi cần kiểm tra thông tin mới nhất" thay vì đưa thông tin sai

CÁCH TRẢ LỜI:
- Ngắn gọn, chính xác, thân thiện bằng tiếng Việt
- Dựa trên kiến thức thực tế, không bịa đặt thông tin
- CHỈ trả về văn bản thuần (plain text), KHÔNG bao gồm JSON, markdown code block, hay định dạng đặc biệt`;

async function fixWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('workflow-db');
    
    // Update workflow 692c76afb5dcf9edd01e9547
    const result = await db.collection('workflows').updateOne(
      { 
        _id: '692c76afb5dcf9edd01e9547',
        'nodes.type': 'GEMINI'
      },
      { 
        $set: { 
          'nodes.$[elem].config.systemPrompt': newSystemPrompt
        } 
      },
      { 
        arrayFilters: [{ 'elem.type': 'GEMINI' }] 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} Gemini node(s) in workflow 692c76afb5dcf9edd01e9547`);
    
    // Also update workflow 693ba5dcbb9af2ecdcaa674a if it exists
    const result2 = await db.collection('workflows').updateOne(
      { 
        _id: '693ba5dcbb9af2ecdcaa674a',
        'nodes.type': 'GEMINI'
      },
      { 
        $set: { 
          'nodes.$[elem].config.systemPrompt': newSystemPrompt
        } 
      },
      { 
        arrayFilters: [{ 'elem.type': 'GEMINI' }] 
      }
    );
    
    console.log(`✅ Updated ${result2.modifiedCount} Gemini node(s) in workflow 693ba5dcbb9af2ecdcaa674a`);
    
    console.log('\n✨ Done! Gemini system prompt updated.');
    console.log('📝 New prompt:', newSystemPrompt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixWorkflow();

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workflow-platform';

async function listWorkflows() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('workflows');
    
    const workflows = await collection.find({}).toArray();
    
    console.log('\n📋 DANH SÁCH WORKFLOWS:\n');
    
    if (workflows.length === 0) {
      console.log('   Không có workflow nào\n');
      return;
    }
    
    workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.name || 'Untitled'}`);
      console.log(`   ID: ${wf._id}`);
      console.log(`   Webhook: ${wf.webhookPath || 'N/A'}`);
      console.log(`   Nodes: ${wf.reactFlowData?.nodes?.length || 0}`);
      
      // Đếm số Gemini nodes
      const geminiCount = wf.reactFlowData?.nodes?.filter(n => n.type === 'gemini').length || 0;
      const groqCount = wf.reactFlowData?.nodes?.filter(n => n.type === 'groq').length || 0;
      
      if (geminiCount > 0) {
        console.log(`   💎 Gemini AI: ${geminiCount} node(s) ⚠️`);
      }
      if (groqCount > 0) {
        console.log(`   ⚡ Groq AI: ${groqCount} node(s) ✅`);
      }
      
      console.log(`   Created: ${wf.createdAt?.toLocaleString() || 'N/A'}`);
      console.log('');
    });
    
    console.log('💡 Để chuyển Gemini → Groq:');
    console.log('   node update-gemini-to-groq.js <workflow_id>\n');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await client.close();
  }
}

listWorkflows();

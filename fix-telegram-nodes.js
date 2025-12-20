/**
 * Fix Telegram nodes - swap chatId and text if they're swapped
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workflow-platform';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function fixTelegramNodes() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const collection = db.collection('workflows');
    
    const workflow = await collection.findOne({ _id: WORKFLOW_ID });
    
    if (!workflow) {
      console.error('❌ Workflow not found');
      return;
    }
    
    console.log('📋 Checking Telegram nodes...\n');
    
    let fixed = 0;
    const nodes = workflow.reactFlowData.nodes.map(node => {
      if (node.type === 'telegram') {
        console.log(`🔍 Telegram node: ${node.id}`);
        console.log(`   Chat ID: ${node.data.chatId}`);
        console.log(`   Text: ${node.data.text?.substring(0, 50)}...`);
        
        // Check if swapped (chatId contains long text, text contains short ID)
        const chatIdLooksLikeText = node.data.chatId && node.data.chatId.length > 50;
        const textLooksLikeId = node.data.text && /^\d+$|webhook/.test(node.data.text);
        
        if (chatIdLooksLikeText || textLooksLikeId) {
          console.log('   ⚠️  SWAPPED! Fixing...');
          
          const temp = node.data.chatId;
          node.data.chatId = node.data.text;
          node.data.text = temp;
          
          console.log(`   ✅ Fixed!`);
          console.log(`   New Chat ID: ${node.data.chatId}`);
          console.log(`   New Text: ${node.data.text?.substring(0, 50)}...`);
          fixed++;
        } else {
          console.log('   ✅ Looks OK');
        }
        console.log('');
      }
      return node;
    });
    
    if (fixed > 0) {
      await collection.updateOne(
        { _id: WORKFLOW_ID },
        { $set: { 'reactFlowData.nodes': nodes } }
      );
      console.log(`\n✅ Fixed ${fixed} Telegram node(s)!`);
      console.log('\n💡 Next: Gửi tin nhắn test vào bot!');
    } else {
      console.log('\n✅ All Telegram nodes look correct!');
      console.log('\n🔍 Check other issues:');
      console.log('   1. Groq API key valid?');
      console.log('   2. Workflow deployed?');
      console.log('   3. Services running?');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixTelegramNodes();

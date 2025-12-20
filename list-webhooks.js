// List all webhooks từ MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function listWebhooks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    const webhooks = db.collection('webhooks');
    
    console.log('🔍 Listing all webhooks...\n');
    
    const allWebhooks = await webhooks.find({}).toArray();
    
    if (allWebhooks.length === 0) {
      console.log('❌ NO WEBHOOKS FOUND!\n');
      console.log('📋 Create webhook in UI:');
      console.log('1. Open http://localhost:5173');
      console.log('2. Deploy workflow');
      console.log('3. Go to Webhooks tab → Create webhook');
      return;
    }
    
    console.log(`✅ Found ${allWebhooks.length} webhook(s):\n`);
    
    allWebhooks.forEach((wh, i) => {
      console.log(`${i + 1}. ${wh.apiKey}`);
      console.log(`   Workflow: ${wh.workflowId}`);
      console.log(`   Active: ${wh.isActive ? 'YES' : 'NO'}`);
      console.log();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

listWebhooks();

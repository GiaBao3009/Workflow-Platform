const { MongoClient } = require('mongodb');

async function analyzeWebhooks() {
  try {
    const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('📊 All webhooks with full details:\n');
    const webhooks = await db.collection('webhooks').find({}).toArray();
    
    webhooks.forEach((w, idx) => {
      console.log(`Webhook #${idx + 1}:`);
      console.log(JSON.stringify(w, null, 2));
      console.log('\n---\n');
    });
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeWebhooks();

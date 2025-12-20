const { MongoClient } = require('mongodb');

async function updateWebhook() {
  try {
    const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
    const client = new MongoClient(uri);
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected!');
    
    const db = client.db('workflow-platform');
    
    const webhookId = 'whk_7c0e3b50a853dab9396922a0ad6f38908fc3cde2f6a4b6a4161b5222085ab056';
    const oldWorkflowId = '692c76afb5dcf9edd01e9547';
    const newWorkflowId = '693ba5dcbb9af2ecdcaa674a';
    
    console.log('\n🔍 Looking for webhook:', webhookId);
    const webhook = await db.collection('webhooks').findOne({ webhookId });
    
    if (!webhook) {
      console.log('❌ Webhook not found!');
      console.log('\n📊 All webhooks:');
      const allWebhooks = await db.collection('webhooks').find({}).toArray();
      allWebhooks.forEach(w => {
        console.log(`   ${w.webhookId} → workflow: ${w.workflowId}`);
      });
    } else {
      console.log('✅ Found webhook!');
      console.log(`   Current workflow: ${webhook.workflowId}`);
      
      if (webhook.workflowId === oldWorkflowId) {
        console.log(`\n🔧 Updating webhook to point to new workflow...`);
        
        await db.collection('webhooks').updateOne(
          { webhookId },
          { $set: { workflowId: newWorkflowId } }
        );
        
        console.log(`✅ Updated! ${oldWorkflowId} → ${newWorkflowId}`);
        console.log('\n🚀 Now send a message to Telegram bot to test!');
      } else if (webhook.workflowId === newWorkflowId) {
        console.log('✅ Webhook already points to new workflow!');
        console.log('\n🚀 Send a message to Telegram bot to test!');
      } else {
        console.log(`⚠️  Webhook points to different workflow: ${webhook.workflowId}`);
      }
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateWebhook();

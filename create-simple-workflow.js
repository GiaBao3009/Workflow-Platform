const { MongoClient, ObjectId } = require('mongodb');

async function createNewWorkflow() {
  try {
    const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('🗑️  Deleting old workflow 692c76afb5dcf9edd01e9547...');
    await db.collection('workflows').deleteOne({ _id: '692c76afb5dcf9edd01e9547' });
    
    console.log('📝 Creating NEW workflow with correct logic...');
    
    const newWorkflow = {
      _id: '693bc' + Date.now().toString().slice(-18), // Generate new ID
      userId: '69347f3dc43b989e64f9e1e4',
      name: 'Telegram Bot - FIXED LOGIC',
      status: 'published',
      triggerType: 'WEBHOOK',
      reactFlowData: {
        nodes: [
          {
            id: 'webhook-trigger',
            type: 'webhook',
            position: { x: 100, y: 100 },
            data: { label: 'Telegram Webhook', platform: 'telegram' }
          },
          {
            id: 'gemini-ai',
            type: 'gemini',
            position: { x: 100, y: 250 },
            data: {
              label: 'Gemini AI',
              model: 'gemini-pro',
              systemPrompt: 'Bạn là chatbot tư vấn sản phẩm. CHỈ trả về text thuần, KHÔNG dùng JSON hoặc markdown.',
              userMessage: '{{webhook.message.text}}',
              maxTokens: 2048,
              temperature: 0.7,
              chatId: '{{webhook.message.chat.id}}',
              useConversationHistory: true
            }
          },
          {
            id: 'telegram-reply',
            type: 'telegram',
            position: { x: 100, y: 400 },
            data: {
              label: 'Reply to User',
              action: 'SEND_MESSAGE',
              botToken: '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks',
              chatId: '{{webhook.message.chat.id}}',
              message: '{{gemini-ai.response}}'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'webhook-trigger',
            target: 'gemini-ai'
          },
          {
            id: 'edge-2',
            source: 'gemini-ai',
            target: 'telegram-reply'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('workflows').insertOne(newWorkflow);
    console.log(`✅ Created workflow: ${newWorkflow._id}`);
    
    console.log('\n🔧 Updating webhook...');
    await db.collection('webhooks').updateOne(
      { apiKey: 'whk_7c0e3b50a853dab9396922a0ad6f38908fc3cde2f6a4b6a4161b5222085ab056' },
      { $set: { workflowId: newWorkflow._id } }
    );
    
    console.log('✅ Webhook updated!');
    console.log('\n🚀 Send "hello" to Telegram bot to test!');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createNewWorkflow();

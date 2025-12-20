const axios = require('axios');

async function createWorkflow() {
  try {
    const newKey = 'AIzaSyAO1m_ohv7eqXbwFcbtMFyLTJeZayNRFbg';
    const userId = 'user-' + Date.now();
    
    const workflow = {
      name: 'Telegram Chatbot - FIXED',
      userId: userId,
      reactFlowData: {
        nodes: [
          {
            id: 'webhook-trigger',
            type: 'webhook',
            position: { x: 100, y: 100 },
            data: {
              label: 'Telegram Webhook',
              platform: 'telegram'
            }
          },
          {
            id: 'gemini-chat',
            type: 'gemini',
            position: { x: 100, y: 250 },
            data: {
              label: 'Gemini Chat',
              apiKey: newKey,
              model: 'gemini-pro',
              systemPrompt: 'Bạn là chatbot tư vấn sản phẩm thông minh, thân thiện và chuyên nghiệp. Luôn trả lời bằng tiếng Việt. CHỈ trả về văn bản thuần (plain text), KHÔNG bao gồm JSON hay markdown.',
              userMessage: '{{webhook.message.text}}',
              maxTokens: 2048,
              temperature: 0.7,
              useConversationHistory: true,
              chatId: '{{webhook.message.chat.id}}'
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
              message: '{{gemini-chat.response}}'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'webhook-trigger',
            target: 'gemini-chat',
            sourceHandle: null,
            targetHandle: null
          },
          {
            id: 'edge-2',
            source: 'gemini-chat',
            target: 'telegram-reply',
            sourceHandle: null,
            targetHandle: null
          }
        ]
      }
    };
    
    console.log('📝 Creating new workflow...');
    const response = await axios.post('http://localhost:3001/api/workflows', workflow);
    
    console.log('✅ Workflow created successfully!');
    console.log('   ID:', response.data.workflow.id);
    console.log('   Name:', response.data.workflow.name);
    
    // Create webhook for this workflow
    const webhookData = {
      workflowId: response.data.workflow.id,
      platform: 'telegram',
      config: {
        botToken: '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks'
      }
    };
    
    console.log('\n🔗 Creating webhook...');
    const webhookResponse = await axios.post('http://localhost:3001/api/webhooks', webhookData);
    
    console.log('✅ Webhook created!');
    console.log('   Webhook ID:', webhookResponse.data.webhook.webhookId);
    console.log('   URL:', webhookResponse.data.webhook.url);
    
    console.log('\n📋 Next steps:');
    console.log('1. Set Telegram webhook:');
    console.log(`   node set-telegram-webhook-quick.js ${webhookResponse.data.webhook.webhookId}`);
    console.log('\n2. Test by sending a message to your Telegram bot!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createWorkflow();

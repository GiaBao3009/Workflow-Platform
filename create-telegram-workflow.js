const axios = require('axios');

async function createTelegramWorkflow() {
  const workflow = {
    name: "Telegram Bot Test",
    description: "Simple Telegram bot with Gemini AI",
    userId: "test-user",
    reactFlowData: {},
    nodes: [
      {
        id: "webhook-1",
        type: "webhook",
        position: { x: 100, y: 100 },
        data: {
          label: "Telegram Webhook",
          trigger: "webhook",
        }
      },
      {
        id: "gemini-1",
        type: "gemini",
        position: { x: 300, y: 100 },
        data: {
          label: "Gemini AI",
          model: "gemini-2.0-flash-exp",
          systemPrompt: "Bạn là chatbot thân thiện. Trả lời ngắn gọn.",
          userMessage: "{{webhook.message.text}}",
          maxTokens: 1024,
          temperature: 0.7,
          chatId: "{{webhook.message.chat.id}}",
          useConversationHistory: true
        }
      },
      {
        id: "telegram-1",
        type: "telegram",
        position: { x: 500, y: 100 },
        data: {
          label: "Send Reply",
          chatId: "{{webhook.message.chat.id}}",
          message: "{{gemini-1.response}}"
        }
      }
    ],
    edges: [
      {
        id: "e1",
        source: "webhook-1",
        target: "gemini-1",
        type: "default"
      },
      {
        id: "e2",
        source: "gemini-1",
        target: "telegram-1",
        type: "default"
      }
    ],
    trigger: {
      type: "webhook",
      config: {}
    }
  };

  try {
    const response = await axios.post('http://localhost:3001/api/workflows', workflow);
    console.log('✅ Workflow created successfully!');
    console.log('📋 Workflow ID:', response.data.workflow._id);
    
    // Get webhooks
    const webhooksResponse = await axios.get(`http://localhost:3001/api/workflows/${response.data.workflow._id}/webhooks`);
    console.log('Webhooks response:', JSON.stringify(webhooksResponse.data, null, 2));
    
    if (!webhooksResponse.data.webhooks || webhooksResponse.data.webhooks.length === 0) {
      console.log('⚠️  No webhooks found. Creating webhook...');
      const createWebhookResponse = await axios.post(`http://localhost:3001/api/workflows/${response.data.workflow._id}/webhooks`, {
        name: 'Telegram Webhook'
      });
      console.log('Created webhook:', createWebhookResponse.data);
      const webhook = createWebhookResponse.data.webhook;
      
      console.log('\n📡 Webhook URL:');
      console.log(`https://objectivistic-tuitional-adriane.ngrok-free.dev/webhooks/${webhook.apiKey}`);
      console.log('\n🔧 Set Telegram webhook with:');
      console.log(`node set-telegram-webhook.js https://objectivistic-tuitional-adriane.ngrok-free.dev/webhooks/${webhook.apiKey}`);
      return webhook;
    }
    
    const webhook = webhooksResponse.data.webhooks[0];
    
    console.log('\n📡 Webhook URL:');
    console.log(`https://objectivistic-tuitional-adriane.ngrok-free.dev/webhooks/${webhook.apiKey}`);
    console.log('\n🔧 Set Telegram webhook with:');
    console.log(`node set-telegram-webhook.js https://objectivistic-tuitional-adriane.ngrok-free.dev/webhooks/${webhook.apiKey}`);
    
    return webhook;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

createTelegramWorkflow().catch(console.error);

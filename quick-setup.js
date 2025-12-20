const axios = require('axios');

const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';
const NGROK_URL = 'https://objectivistic-tuitional-adriane.ngrok-free.dev';
const BACKEND_URL = 'http://localhost:3001';
const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';

async function setupWebhook() {
  console.log('==================================================================');
  console.log(' SETUP TELEGRAM + GOOGLE SHEETS WORKFLOW');
  console.log('==================================================================\n');
  
  try {
    // Step 1: Check backend
    console.log('[1/4] Checking Backend API...');
    try {
      await axios.get(`${BACKEND_URL}/health`);
      console.log('   ✅ Backend is running\n');
    } catch (error) {
      console.log('   ❌ Backend is NOT running!');
      console.log('   💡 Start backend first: cd apps\\backend-api; node dist\\index.js\n');
      process.exit(1);
    }
    
    // Step 2: Create or get webhook
    console.log('[2/4] Creating webhook...');
    let webhookId, localWebhookUrl, publicWebhookUrl;
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/workflows/${WORKFLOW_ID}/webhooks`,
        { 
          name: 'Telegram Bot Webhook',
          description: 'Telegram chatbot webhook' 
        }
      );
      
      webhookId = response.data.webhook.apiKey;
      localWebhookUrl = response.data.webhook.webhookUrl;
      publicWebhookUrl = `${NGROK_URL}/webhooks/${webhookId}`;
      
      console.log(`   ✅ Webhook created: ${webhookId}`);
      console.log(`   📍 Local:  ${localWebhookUrl}`);
      console.log(`   📍 Public: ${publicWebhookUrl}\n`);
      
    } catch (error) {
      console.log('   💡 Checking existing webhooks...');
      
      const listResponse = await axios.get(`${BACKEND_URL}/api/workflows/${WORKFLOW_ID}/webhooks`);
      
      if (listResponse.data.webhooks && listResponse.data.webhooks.length > 0) {
        const webhook = listResponse.data.webhooks[0];
        webhookId = webhook.apiKey;
        localWebhookUrl = webhook.webhookUrl;
        publicWebhookUrl = `${NGROK_URL}/webhooks/${webhookId}`;
        
        console.log(`   ✅ Using existing webhook: ${webhookId}`);
        console.log(`   📍 Public: ${publicWebhookUrl}\n`);
      } else {
        console.log('   ❌ No webhooks found');
        process.exit(1);
      }
    }
    
    // Step 3: Set Telegram webhook
    console.log('[3/4] Setting Telegram webhook...');
    try {
      const telegramResponse = await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
        { url: publicWebhookUrl }
      );
      
      if (telegramResponse.data.ok) {
        console.log('   ✅ Telegram webhook set successfully!\n');
      } else {
        console.log(`   ❌ Telegram webhook failed: ${telegramResponse.data.description}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Telegram API error: ${error.message}\n`);
    }
    
    // Step 4: Verify webhook
    console.log('[4/4] Verifying Telegram webhook...');
    try {
      const webhookInfo = await axios.get(
        `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
      );
      
      console.log(`   📍 Current webhook: ${webhookInfo.data.result.url}`);
      console.log(`   ✅ Pending updates: ${webhookInfo.data.result.pending_update_count}`);
      
      if (webhookInfo.data.result.last_error_message) {
        console.log(`   ⚠️  Last error: ${webhookInfo.data.result.last_error_message}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Failed to verify: ${error.message}\n`);
    }
    
    // Summary
    console.log('==================================================================');
    console.log(' ✅ SETUP COMPLETE!');
    console.log('==================================================================\n');
    
    console.log('📊 GOOGLE SHEETS:');
    console.log('   Spreadsheet ID: 1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ');
    console.log('   Sheet: Sheet1\n');
    
    console.log('⚠️  QUAN TRỌNG: Share sheet với Service Account');
    console.log('   Email: workflow-sheets-313@my-workflow-platform-480113.iam.gserviceaccount.com');
    console.log('   Quyền: Editor\n');
    
    console.log('🧪 TEST NGAY:');
    console.log("   1. Mở Telegram chat với bot của bạn");
    console.log("   2. Gửi: 'Xin chào' → Bot sẽ trả lời");
    console.log("   3. Gửi: 'Tôi đánh giá 9 điểm' → Lưu vào Sheet\n");
    
    console.log('⚙️  SERVICES CẦN CHẠY:');
    console.log('   ✅ Backend: node apps/backend-api/dist/index.js');
    console.log('   ⚠️  Worker: node hello-temporal/dist/worker.js (CẦN START!)');
    console.log('   ✅ ngrok: ngrok http 3001');
    console.log('   ✅ Temporal: docker-compose up -d\n');
    
    console.log('==================================================================');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

setupWebhook();

const axios = require('axios');

const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';

// Lấy FULL_WEBHOOK_URL từ command line argument
const FULL_WEBHOOK_URL = process.argv[2];

if (!FULL_WEBHOOK_URL) {
  console.error('❌ Vui lòng cung cấp full webhook URL!');
  console.log('Sử dụng: node set-telegram-webhook.js https://your-ngrok-url.ngrok-free.dev/webhooks/whk_...');
  process.exit(1);
}

async function setWebhook() {
  try {
    console.log('🔧 Setting Telegram webhook...');
    console.log(`📡 Webhook URL: ${FULL_WEBHOOK_URL}`);
    
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: FULL_WEBHOOK_URL,
      drop_pending_updates: true, // Xóa các updates cũ
    });

    if (response.data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('📋 Response:', response.data);
      
      // Kiểm tra webhook info
      const infoResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      console.log('\n📊 Webhook Info:');
      console.log(JSON.stringify(infoResponse.data.result, null, 2));
    } else {
      console.error('❌ Failed to set webhook:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setWebhook();

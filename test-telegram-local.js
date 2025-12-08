/**
 * Test Telegram Bot local (không cần ngrok)
 * Dùng Long Polling để nhận message và gọi webhook local
 */

const axios = require('axios');

const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
const WEBHOOK_URL = 'http://localhost:3001/webhooks/whk_3c423f708bf92e9cd46d56100742221d2b8a9bcfcd747b8469fefebc215da21c';

let lastUpdateId = 0;

console.log('🤖 Telegram Bot Local Tester');
console.log('📡 Listening for messages...\n');

async function getUpdates() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        timeout: 30,
      }
    });

    const updates = response.data.result;

    for (const update of updates) {
      lastUpdateId = update.update_id;

      if (update.message) {
        console.log(`\n📩 New message from ${update.message.from.first_name}:`);
        console.log(`   Text: "${update.message.text}"`);
        console.log(`   Chat ID: ${update.message.chat.id}`);

        // Forward to local webhook
        console.log(`\n🔄 Forwarding to webhook...`);
        try {
          const webhookResponse = await axios.post(WEBHOOK_URL, update, {
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log(`✅ Webhook responded: ${webhookResponse.status}`);
          console.log(`   Response:`, webhookResponse.data);
        } catch (error) {
          console.error(`❌ Webhook error:`, error.response?.data || error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error getting updates:', error.message);
  }

  // Poll again
  setTimeout(getUpdates, 1000);
}

// Start polling
getUpdates();

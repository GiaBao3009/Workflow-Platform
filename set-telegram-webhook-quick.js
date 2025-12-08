// Quick script to set Telegram webhook
const https = require('https');

const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
const NGROK_URL = 'https://objectivistic-tuitional-adriane.ngrok-free.dev';

// Get webhook API key from command line
const webhookApiKey = process.argv[2];

if (!webhookApiKey) {
  console.error('❌ Usage: node set-telegram-webhook-quick.js <WEBHOOK_API_KEY>');
  console.log('\n📋 Steps:');
  console.log('1. Open http://localhost:5173');
  console.log('2. Deploy workflow (click 🚀 Deploy)');
  console.log('3. Go to Webhooks tab');
  console.log('4. Create webhook and copy API key');
  console.log('5. Run: node set-telegram-webhook-quick.js <API_KEY>');
  process.exit(1);
}

const webhookUrl = `${NGROK_URL}/webhooks/${webhookApiKey}`;

console.log(`\n🔧 Setting Telegram webhook...`);
console.log(`📍 URL: ${webhookUrl}`);

const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('\n📋 Verify with:');
      console.log(`node -e "const https = require('https'); https.get('https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo', (res) => { let data = ''; res.on('data', (chunk) => data += chunk); res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2))); })"`);
    } else {
      console.error('❌ Failed to set webhook:', result);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});

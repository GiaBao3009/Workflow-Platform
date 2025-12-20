/**
 * Script kiểm tra tất cả services và logs
 */

const { exec } = require('child_process');
const https = require('https');
const http = require('http');

console.log('🔍 CHECKING ALL SERVICES & LOGS...\n');

// Check 1: Backend status
console.log('[1/5] Backend (port 3001)...');
exec('netstat -ano | findstr :3001', (error, stdout) => {
  if (stdout) {
    console.log('   ✅ Backend is running on port 3001');
    
    // Test backend health
    http.get('http://localhost:3001/api/health', (res) => {
      console.log(`   ✅ Backend health: ${res.statusCode}`);
    }).on('error', (e) => {
      console.log(`   ⚠️  Backend health check failed: ${e.message}`);
    });
  } else {
    console.log('   ❌ Backend NOT running on port 3001');
    console.log('   💡 Run: cd apps/backend-api && npm run dev');
  }
});

// Check 2: Worker status
setTimeout(() => {
  console.log('\n[2/5] Worker (Temporal port 7233)...');
  exec('netstat -ano | findstr :7233', (error, stdout) => {
    if (stdout) {
      console.log('   ✅ Temporal is running on port 7233');
    } else {
      console.log('   ❌ Temporal NOT running');
      console.log('   💡 Run: docker-compose up -d');
    }
  });
}, 500);

// Check 3: Ngrok status
setTimeout(() => {
  console.log('\n[3/5] Ngrok (port 4040)...');
  http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const tunnels = JSON.parse(data);
        if (tunnels.tunnels && tunnels.tunnels.length > 0) {
          const publicUrl = tunnels.tunnels[0].public_url;
          console.log('   ✅ Ngrok is running');
          console.log(`   📍 Public URL: ${publicUrl}`);
          console.log(`   📍 Webhook URL: ${publicUrl}/webhooks/whk_...`);
        } else {
          console.log('   ⚠️  Ngrok running but no tunnels');
        }
      } catch (e) {
        console.log('   ❌ Failed to parse ngrok response');
      }
    });
  }).on('error', () => {
    console.log('   ❌ Ngrok NOT running');
    console.log('   💡 Run: npm run ngrok');
  });
}, 1000);

// Check 4: Telegram webhook status
setTimeout(() => {
  console.log('\n[4/5] Telegram Webhook...');
  const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
  
  https.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.ok) {
          const info = result.result;
          if (info.url) {
            console.log('   ✅ Webhook is set');
            console.log(`   📍 URL: ${info.url}`);
            console.log(`   📊 Pending updates: ${info.pending_update_count}`);
            
            if (info.last_error_date) {
              console.log(`   ⚠️  Last error: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
              console.log(`   ⚠️  Error message: ${info.last_error_message}`);
            }
          } else {
            console.log('   ❌ Webhook NOT set');
            console.log('   💡 Run: node set-telegram-webhook.js <WEBHOOK_URL>');
          }
        }
      } catch (e) {
        console.log('   ❌ Failed to check webhook:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('   ❌ Telegram API error:', e.message);
  });
}, 1500);

// Check 5: Recent logs (if backend is running)
setTimeout(() => {
  console.log('\n[5/5] Testing webhook endpoint...');
  
  http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const tunnels = JSON.parse(data);
        if (tunnels.tunnels && tunnels.tunnels.length > 0) {
          const publicUrl = tunnels.tunnels[0].public_url;
          console.log(`   💡 Test your webhook with:`);
          console.log(`   curl -X POST ${publicUrl}/webhooks/whk_YOUR_KEY -H "Content-Type: application/json" -d "{\\"message\\": {\\"text\\": \\"test\\", \\"chat\\": {\\"id\\": 123}}}"`);
        }
      } catch (e) {
        // Ignore
      }
    });
  }).on('error', () => {
    console.log('   ⚠️  Ngrok not available for testing');
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 SUMMARY');
  console.log('='.repeat(70));
  console.log('\nIf you see ❌, fix those services first!');
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Make sure all ✅ are green');
  console.log('2. Send a message to your Telegram bot');
  console.log('3. Check backend terminal for logs');
  console.log('4. Check worker terminal for Groq API calls');
  console.log('\n📝 LOG LOCATIONS:');
  console.log('   - Backend logs: Check terminal running "npm run dev" in apps/backend-api');
  console.log('   - Worker logs: Check terminal running "npm run dev" in hello-temporal');
  console.log('   - Ngrok logs: http://localhost:4040/inspect/http');
  console.log('');
}, 2000);

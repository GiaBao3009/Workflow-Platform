const axios = require('axios');

const BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
const WEBHOOK_URL = 'https://objectivistic-tuitional-adriane.ngrok-free.dev/webhooks/whk_0bff5549c821bcdb7e5534b0f55410f56e72f15677cc9e7d3a676aca8b5700b3';

async function testBot() {
  console.log('🧪 TESTING TELEGRAM BOT\n');
  
  // Test 1: Get bot info
  console.log('[1/3] Checking bot info...');
  try {
    const botInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    console.log('   ✅ Bot:', botInfo.data.result.username);
    console.log('   ✅ Bot ID:', botInfo.data.result.id);
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
  }
  
  // Test 2: Check webhook
  console.log('\n[2/3] Checking webhook...');
  try {
    const webhookInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    console.log('   ✅ Webhook URL:', webhookInfo.data.result.url);
    console.log('   ✅ Pending updates:', webhookInfo.data.result.pending_update_count);
    
    if (webhookInfo.data.result.last_error_message) {
      console.log('   ⚠️  Last error:', webhookInfo.data.result.last_error_message);
      console.log('   ⚠️  Error date:', new Date(webhookInfo.data.result.last_error_date * 1000));
    } else {
      console.log('   ✅ No errors');
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
  }
  
  // Test 3: Send test message to webhook
  console.log('\n[3/3] Testing webhook endpoint...');
  try {
    const testPayload = {
      update_id: 123456789,
      message: {
        message_id: 1,
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
          username: 'test_user'
        },
        chat: {
          id: 123456,
          first_name: 'Test',
          username: 'test_user',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Test message from script'
      }
    };
    
    const response = await axios.post(WEBHOOK_URL, testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   ✅ Webhook responded:', response.status);
    console.log('   ✅ Response:', response.data);
  } catch (error) {
    console.log('   ❌ Webhook error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n==================================================================');
  console.log('💡 HƯỚNG DẪN TEST THỰC TẾ:');
  console.log('==================================================================');
  console.log('1. Mở Telegram và tìm bot của bạn');
  console.log('2. Gửi tin nhắn: "Xin chào"');
  console.log('3. Đợi bot trả lời (qua Gemini AI)');
  console.log('4. Gửi feedback: "Tôi đánh giá 9 điểm"');
  console.log('5. Kiểm tra Google Sheet để xem dữ liệu');
  console.log('\n📋 CHECK SERVICES:');
  console.log('   ✅ Backend: http://localhost:3001/health');
  console.log('   ✅ Temporal UI: http://localhost:8080');
  console.log('   ⚠️  Worker: Xem terminal worker có log không');
  console.log('==================================================================\n');
}

testBot();

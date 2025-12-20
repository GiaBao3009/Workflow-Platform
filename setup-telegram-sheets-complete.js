const axios = require('axios');
const readline = require('readline');

const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';
const BACKEND_URL = 'http://localhost:3001';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupTelegramWebhook() {
  console.log('🚀 SETUP TELEGRAM + GOOGLE SHEETS WORKFLOW\n');
  console.log('Workflow ID:', WORKFLOW_ID);
  console.log('Workflow Name: node chat tele đánh giá sheets\n');
  
  try {
    // Step 1: Create webhook
    console.log('[1/4] Tạo webhook...');
    const webhookResponse = await axios.post(`${BACKEND_URL}/api/workflows/${WORKFLOW_ID}/webhooks`, {
      name: 'Telegram Bot Webhook',
      description: 'Telegram chatbot webhook'
    });
    
    const webhookId = webhookResponse.data.webhook.webhookId;
    const localWebhookUrl = webhookResponse.data.webhook.url;
    console.log('   ✅ Webhook created:', webhookId);
    console.log('   📍 Local URL:', localWebhookUrl);
    
    // Step 2: Get ngrok URL
    console.log('\n[2/4] Nhập ngrok URL của bạn');
    console.log('   💡 Bật ngrok: npm run ngrok hoặc start-ngrok.bat');
    console.log('   💡 Copy URL từ ngrok (vd: https://abc123.ngrok.io)\n');
    
    rl.question('   Nhập ngrok URL (hoặc bấm Enter để skip): ', async (ngrokUrl) => {
      if (!ngrokUrl || ngrokUrl.trim() === '') {
        console.log('\n   ⚠️ Chưa có ngrok URL - bạn sẽ cần setup sau');
        console.log('   📝 Lưu ý: Telegram cần HTTPS URL để nhận webhook\n');
        printSummary(localWebhookUrl, null);
        rl.close();
        return;
      }
      
      // Clean up ngrok URL
      ngrokUrl = ngrokUrl.trim().replace(/\/$/, ''); // Remove trailing slash
      const publicWebhookUrl = `${ngrokUrl}/webhook/${webhookId}`;
      
      // Step 3: Set Telegram webhook
      console.log('\n[3/4] Đang set Telegram webhook...');
      const botToken = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
      const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
      
      try {
        const telegramResponse = await axios.post(telegramUrl, {
          url: publicWebhookUrl
        });
        
        if (telegramResponse.data.ok) {
          console.log('   ✅ Telegram webhook set thành công!');
        } else {
          console.log('   ❌ Telegram webhook failed:', telegramResponse.data.description);
        }
      } catch (error) {
        console.error('   ❌ Telegram API error:', error.message);
      }
      
      // Step 4: Print summary
      printSummary(localWebhookUrl, publicWebhookUrl);
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    rl.close();
  }
}

function printSummary(localUrl, publicUrl) {
  console.log('\n' + '='.repeat(70));
  console.log('✅ SETUP HOÀN TẤT!');
  console.log('='.repeat(70));
  
  console.log('\n📍 WEBHOOK URLs:');
  console.log('   Local:  ', localUrl);
  if (publicUrl) {
    console.log('   Public: ', publicUrl);
  }
  
  console.log('\n📊 GOOGLE SHEETS:');
  console.log('   Spreadsheet ID: 1EaoPKCV9LJld5v5VP9Kcm-06PbiQhoO7pUmTSZIZFxQ');
  console.log('   Sheet: Sheet1');
  console.log('   ⚠️  QUAN TRỌNG: Share sheet với email:');
  console.log('       workflow-sheets-313@my-workflow-platform-480113.iam.gserviceaccount.com');
  console.log('       Quyền: Editor');
  
  console.log('\n🤖 TELEGRAM BOT:');
  console.log('   Bot: @YourBotName');
  console.log('   Token: 8204300365:AAG...(hidden)');
  
  console.log('\n🧪 TEST:');
  console.log('   1. Mở Telegram chat với bot của bạn');
  console.log('   2. Gửi tin nhắn: "Xin chào"');
  console.log('   3. Bot sẽ trả lời qua Gemini AI');
  console.log('   4. Gửi feedback: "Tôi đánh giá 9 điểm" hoặc "Rất tốt"');
  console.log('   5. Dữ liệu sẽ lưu vào Google Sheet + bot reply "Đã lưu"');
  
  console.log('\n📝 WORKFLOW LOGIC:');
  console.log('   1. User gửi tin nhắn → Gemini AI xử lý');
  console.log('   2. Nếu là feedback → Lưu vào Google Sheets');
  console.log('   3. Nếu negative → Gửi cảnh báo');
  console.log('   4. Nếu là câu hỏi bình thường → Trả lời trực tiếp');
  
  console.log('\n⚙️  SERVICES CẦN CHẠY:');
  console.log('   ✅ Backend: node apps/backend-api/dist/index.js');
  console.log('   ✅ Worker: node hello-temporal/dist/worker.js');
  console.log('   ✅ Temporal: docker-compose up -d');
  if (!publicUrl) {
    console.log('   ⚠️  ngrok: npm run ngrok (để expose localhost ra public)');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

setupTelegramWebhook();

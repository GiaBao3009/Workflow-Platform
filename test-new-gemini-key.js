const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyCJbszinImGRTEXYroaXBgW3n3q-ZzT134';
const TELEGRAM_BOT_TOKEN = '8204300365:AAGo6LAx7WP5bvt9o_b2ieIGHWaWz-gFIks';
const CHAT_ID = '8475393129'; // Your Telegram chat ID

async function testGeminiKey() {
  console.log('🧪 Testing new Gemini API key...\n');
  
  try {
    // Test 1: Call Gemini API directly
    console.log('1️⃣ Testing Gemini API directly...');
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Hello, respond with "API key is working!" in Vietnamese'
          }]
        }]
      }
    );
    
    const geminiText = geminiResponse.data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini API response:', geminiText);
    
    // Test 2: Send message via Telegram bot
    console.log('\n2️⃣ Sending test message to Telegram bot...');
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: '🧪 Test: ' + geminiText
      }
    );
    
    if (telegramResponse.data.ok) {
      console.log('✅ Test message sent to Telegram successfully!');
    }
    
    console.log('\n✅ ALL TESTS PASSED! New Gemini API key is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testGeminiKey();

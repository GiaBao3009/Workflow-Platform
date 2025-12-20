// Test đơn giản: Gửi tin nhắn Telegram trực tiếp
require('dotenv').config();
const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '8475393129'; // Your chat ID

async function sendMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await axios.post(url, {
      chat_id: CHAT_ID,
      text: text
    });
    
    console.log('✅ Message sent successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test gửi tin nhắn
sendMessage('🧪 Test from direct script - ' + new Date().toISOString());

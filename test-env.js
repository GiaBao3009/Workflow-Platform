require('dotenv').config();

console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `EXISTS (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : 'NOT FOUND');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'EXISTS' : 'NOT FOUND');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'EXISTS' : 'NOT FOUND');
console.log('==================================');

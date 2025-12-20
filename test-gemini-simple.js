// Simple test for Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyAj9-ovWVc1RZlXI8W73dSBrwCaEkn5asE';

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('🧪 Testing Gemini API call...');
    const result = await model.generateContent('Say "API key works!" in Vietnamese');
    const text = result.response.text();
    
    console.log('✅ SUCCESS!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

test();

// Simple HTTPS test for Gemini API key
const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: 'Say "API key works!" in Vietnamese'
    }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing Gemini API call...');

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(body);
      console.log('✅ SUCCESS!');
      console.log('Response:', response.candidates[0].content.parts[0].text);
    } else {
      console.error('❌ FAILED:', res.statusCode);
      console.error('Error:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();

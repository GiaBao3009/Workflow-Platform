// Test với CHÍNH XÁC model và config production dùng
const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;
const model = 'gemini-2.5-flash'; // Chính xác model production dùng

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: 'Say hello in Vietnamese'
    }]
  }],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`🧪 Testing Gemini API với model: ${model}`);
console.log(`🔑 API Key first 10 chars: ${apiKey.substring(0, 10)}`);
console.log(`📡 URL: https://${options.hostname}${options.path.substring(0, 80)}...`);

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(body);
      console.log('✅ SUCCESS!');
      console.log('Response:', response.candidates[0].content.parts[0].text);
    } else {
      console.error('❌ FAILED!');
      console.error('Full error body:', body);
      try {
        const errorData = JSON.parse(body);
        console.error('\n🔍 Parsed error:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Could not parse error as JSON');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();

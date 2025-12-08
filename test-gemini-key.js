// Test Gemini API key directly
const https = require('https');

const apiKey = 'AIzaSyAJ4NVHcioKYpfxjF9UQ_kL41KsSvApd40';
const data = JSON.stringify({
  contents: [{
    parts: [{ text: 'Say hello in Vietnamese' }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();

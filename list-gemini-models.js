// List available Gemini models
const https = require('https');

const apiKey = 'AIzaSyAJ4NVHcioKYpfxjF9UQ_kL41KsSvApd40';

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    if (data.models) {
      console.log('\nAvailable models:');
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.supportedGenerationMethods?.join(', ')})`);
      });
    } else {
      console.log('Response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();

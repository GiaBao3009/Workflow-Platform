// List available Gemini models
const https = require('https');

const apiKey = 'AIzaSyAj9-ovWVc1RZlXI8W73dSBrwCaEkn5asE';

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

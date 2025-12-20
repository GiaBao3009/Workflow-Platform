const axios = require('axios');

async function checkWebhook() {
  try {
    const webhookId = 'whk_7c0e3b50a853dab9396922a0ad6f38908fc3cde2f6a4b6a4161b5222085ab056';
    
    // Try to get webhook info from backend logs or database
    // Since we don't have direct webhook GET endpoint, let's check worker logs
    
    console.log('🔍 Checking webhook:', webhookId);
    console.log('\n📋 Recent workflow executions in worker logs should show:');
    console.log('   [executeWorkflow(WORKFLOW_ID-webhook-...)]');
    console.log('\n💡 Please check the NEW worker window that just opened');
    console.log('   Look for lines like: [executeWorkflow(693ba5dcbb9af2ecdcaa674a-webhook-...)]');
    console.log('\n   The WORKFLOW_ID is the part before "-webhook-"');
    console.log('\n🚀 Or send a test message to Telegram bot and check worker logs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWebhook();

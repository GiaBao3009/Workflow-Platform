const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-platform';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function fixWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    console.log('🔧 Fixing workflow configuration...\n');
    
    // 1. Get current workflow
    const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log('✅ Found workflow:', workflow.name);
    console.log('   Current triggerType:', workflow.triggerType);
    
    // 2. Update triggerType to WEBHOOK
    const result = await db.collection('workflows').updateOne(
      { _id: new ObjectId(WORKFLOW_ID) },
      { $set: { triggerType: 'WEBHOOK' } }
    );
    
    console.log(`✅ Updated triggerType to WEBHOOK (${result.modifiedCount} doc)`);
    
    // 3. Get webhook info
    const webhook = await db.collection('webhooks').findOne({ workflowId: WORKFLOW_ID });
    if (webhook) {
      console.log('\n📍 Webhook Info:');
      console.log('   ID:', webhook.webhookId);
      console.log('   URL:', webhook.url);
      console.log('   Active:', webhook.active);
      
      console.log('\n🚀 CÁCH SỬ DỤNG:');
      console.log('   1. Set Telegram webhook:');
      console.log(`      node set-telegram-webhook-quick.js ${webhook.url.replace('http://localhost:3001', 'YOUR_NGROK_URL')}`);
      console.log('   2. Hoặc nếu đã có ngrok chạy:');
      console.log('      - Bật ngrok: npm run ngrok');
      console.log('      - Copy ngrok URL (vd: https://abc123.ngrok.io)');
      console.log('      - Set webhook: node set-telegram-webhook-quick.js https://abc123.ngrok.io');
    } else {
      console.log('\n⚠️ No webhook found - tạo webhook trước!');
    }
    
    // 4. Check Google Sheets node config
    const sheetsNode = workflow.reactFlowData.nodes.find(n => n.type === 'googleSheets');
    if (sheetsNode) {
      console.log('\n📊 Google Sheets Config:');
      console.log('   Spreadsheet ID:', sheetsNode.data.spreadsheetId);
      console.log('   Sheet Name:', sheetsNode.data.sheetName);
      console.log('   Action:', sheetsNode.data.action);
      console.log('   Range:', sheetsNode.data.range);
      
      console.log('\n📝 QUAN TRỌNG:');
      console.log('   - Service Account JSON đã được cấu hình trong .env');
      console.log('   - Đảm bảo share sheet với email:');
      console.log('     workflow-sheets-313@my-workflow-platform-480113.iam.gserviceaccount.com');
      console.log('   - Quyền: Editor');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixWorkflow();

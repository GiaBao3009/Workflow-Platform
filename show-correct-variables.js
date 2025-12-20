const mongoose = require('mongoose');

async function showCorrectVariables() {
  try {
    await mongoose.connect('mongodb://localhost:27017/workflow-platform');
    console.log('✅ Connected to MongoDB\n');

    const Workflow = mongoose.model('Workflow', new mongoose.Schema({}, { strict: false, collection: 'workflows' }));

    const workflow = await Workflow.findOne({ _id: '693ba5dcbb9af2ecdcaa674a' });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }

    console.log('📋 CORRECT VARIABLE NAMES FOR YOUR WORKFLOW:\n');
    console.log('=' .repeat(60));

    const nodes = workflow.nodes || [];
    
    // Find all nodes that produce outputs
    const outputNodes = nodes.filter(n => 
      ['groq', 'gemini', 'webhook', 'googleSheets', 'contentFilter'].includes(n.type)
    );

    outputNodes.forEach(node => {
      console.log(`\n🔹 ${node.type.toUpperCase()} Node:`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Label: ${node.data?.label || 'No label'}`);
      
      if (node.type === 'groq' || node.type === 'gemini') {
        console.log(`   ✅ Use: {{${node.id}.response}}`);
        console.log(`   ❌ NOT: {{groq-1.response}} or {{gemini-1.response}}`);
      } else if (node.type === 'webhook') {
        console.log(`   ✅ Use: {{${node.id}.message.chat.id}}`);
        console.log(`   ✅ Use: {{${node.id}.message.text}}`);
      } else if (node.type === 'googleSheets') {
        console.log(`   ✅ Use: {{${node.id}.result}}`);
      } else if (node.type === 'contentFilter') {
        console.log(`   ✅ Use: {{${node.id}.result}}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 TELEGRAM NODES TO FIX:\n');

    const telegramNodes = nodes.filter(n => n.type === 'telegram');
    
    for (const tg of telegramNodes) {
      console.log(`\n🔸 Telegram Node: ${tg.id}`);
      console.log(`   Current chatId: ${tg.data?.chatId || 'Not set'}`);
      console.log(`   Current text: ${tg.data?.text || 'Not set'}`);
      
      // Check for wrong variable references
      const text = tg.data?.text || '';
      const chatId = tg.data?.chatId || '';
      
      if (text.includes('groq-1.') || text.includes('gemini-1.') || text.includes('sheets-1.')) {
        console.log('   ⚠️  PROBLEM: Using shortened variable name!');
        
        // Find the actual groq/gemini node
        const aiNode = outputNodes.find(n => n.type === 'groq' || n.type === 'gemini');
        if (aiNode) {
          console.log(`   ✅ SHOULD BE: {{${aiNode.id}.response}}`);
        }
      }
      
      if (chatId.includes('webhook.') && !chatId.includes('webhook-')) {
        console.log('   ⚠️  PROBLEM: Using generic webhook reference!');
        const webhookNode = outputNodes.find(n => n.type === 'webhook');
        if (webhookNode) {
          console.log(`   ✅ SHOULD BE: {{${webhookNode.id}.message.chat.id}}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 QUICK FIX IN UI:\n');
    console.log('1. Open the workflow in the frontend');
    console.log('2. Click each Telegram node');
    console.log('3. Update the "text" field to use the FULL node ID shown above');
    console.log('4. Update the "chatId" field to use the FULL webhook ID shown above');
    console.log('5. Click "Lưu thay đổi" (Save changes)');
    console.log('6. Click "Deploy" button\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

showCorrectVariables();

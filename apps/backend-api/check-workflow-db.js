const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const workflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', workflowSchema);

async function checkWorkflow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const workflow = await Workflow.findOne({ _id: '693ba5dcbb9af2ecdcaa674a' });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }

    console.log('📋 Workflow:', workflow.name);
    console.log('Status:', workflow.status);
    console.log('\n🔍 Google Sheets nodes:\n');
    
    const sheetsNodes = workflow.reactFlowData.nodes.filter(n => n.type === 'googleSheets');
    
    sheetsNodes.forEach(node => {
      console.log('  Node ID:', node.id);
      console.log('  Action:', node.data.action);
      console.log('  Sheet Name:', node.data.sheetName);
      console.log('  📍 Range:', JSON.stringify(node.data.range));
      console.log('  SpreadsheetId:', node.data.spreadsheetId.substring(0, 20) + '...');
      console.log('  Values (first 100 chars):', JSON.stringify(node.data.values).substring(0, 100));
      console.log();
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkWorkflow();

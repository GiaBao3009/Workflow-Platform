const mongoose = require('mongoose');
require('dotenv').config();

const workflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', workflowSchema);

async function checkSheetsRange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation');
    console.log('✅ Connected to MongoDB\n');

    const workflow = await Workflow.findOne({ _id: '693ba5dcbb9af2ecdcaa674a' });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }

    console.log('📋 Workflow:', workflow.name);
    console.log('\n🔍 Google Sheets nodes:');
    
    const sheetsNodes = workflow.nodes.filter(n => n.type === 'googleSheets');
    
    sheetsNodes.forEach(node => {
      console.log('\n  Node ID:', node.id);
      console.log('  Action:', node.data.action);
      console.log('  Sheet Name:', node.data.sheetName);
      console.log('  📍 Range:', node.data.range);
      console.log('  Values:', JSON.stringify(node.data.values).substring(0, 100) + '...');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSheetsRange();

const mongoose = require('mongoose');
require('dotenv').config();

const workflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', workflowSchema);

async function fixSheetsRange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation');
    console.log('✅ Connected to MongoDB\n');

    const workflow = await Workflow.findOne({ _id: '693ba5dcbb9af2ecdcaa674a' });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }

    console.log('📋 Workflow:', workflow.name);
    console.log('\n🔧 Fixing Google Sheets nodes...\n');
    
    if (!workflow.reactFlowData || !workflow.reactFlowData.nodes) {
      console.log('❌ reactFlowData.nodes not found!');
      return;
    }
    
    console.log('✅ Found', workflow.reactFlowData.nodes.length, 'nodes\n');
    
    let updated = false;
    
    workflow.reactFlowData.nodes.forEach(node => {
      if (node.type === 'googleSheets') {
        console.log('  📍 Node:', node.id);
        console.log('     Type:', node.type);
        console.log('     Current range:', node.data?.range || 'N/A');
        
        if (node.data && node.data.range === 'A:F') {
          console.log('     ❌ Old range:', node.data.range);
          
          node.data.range = 'A1:F';
          
          console.log('     ✅ New range:', node.data.range);
          updated = true;
        } else if (node.data && node.data.range === 'A1:F') {
          console.log('     ✅ Already correct!');
        }
        console.log();
      }
    });

    if (updated) {
      await workflow.save();
      console.log('✅ Updated database successfully!');
      console.log('🔄 Now restart worker: cd hello-temporal && npm run dev');
    } else {
      console.log('ℹ️  No updates needed - all ranges already correct');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixSheetsRange();

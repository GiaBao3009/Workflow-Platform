const mongoose = require('mongoose');
require('dotenv').config();

const workflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', workflowSchema);

async function checkGroqNode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const workflow = await Workflow.findOne({ _id: '693ba5dcbb9af2ecdcaa674a' });
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }

    const groqNode = workflow.reactFlowData.nodes.find(n => n.type === 'groq');
    
    if (!groqNode) {
      console.log('❌ Groq node not found');
      return;
    }

    console.log('🤖 Groq Node Configuration:\n');
    console.log('Node ID:', groqNode.id);
    console.log('Model:', groqNode.data.model);
    console.log('\n📝 System Prompt (first 500 chars):');
    console.log(groqNode.data.systemPrompt.substring(0, 500));
    console.log('\n... (truncated)');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkGroqNode();

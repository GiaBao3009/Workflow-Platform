const mongoose = require('mongoose');
require('dotenv').config();

const WorkflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', WorkflowSchema);

async function checkParsing() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const workflow = await Workflow.findById('693ba5dcbb9af2ecdcaa674a');
    console.log('📊 Workflow:', workflow.name);
    console.log('🔍 reactFlowData type:', typeof workflow.reactFlowData);
    console.log('🔍 Is string:', typeof workflow.reactFlowData === 'string');
    
    let parsed;
    if (typeof workflow.reactFlowData === 'string') {
      console.log('\n🔧 Parsing JSON string...');
      parsed = JSON.parse(workflow.reactFlowData);
    } else {
      console.log('\n✅ Already object');
      parsed = workflow.reactFlowData;
    }

    console.log('\n📦 Nodes count:', parsed.nodes?.length || 0);
    console.log('🔗 Edges count:', parsed.edges?.length || 0);
    
    console.log('\n🎯 Gemini node:');
    const geminiNode = parsed.nodes?.find(n => n.id === 'gemini-1765516888069');
    console.log('  - Type:', geminiNode?.type);
    console.log('  - Data.label:', geminiNode?.data?.label);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkParsing();

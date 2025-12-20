const mongoose = require('mongoose');
require('dotenv').config();

const WorkflowSchema = new mongoose.Schema({}, { strict: false, collection: 'workflows' });
const Workflow = mongoose.model('Workflow', WorkflowSchema);

async function updateToGroq() {
  try {
    console.log('✅ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const workflow = await Workflow.findById('693ba5dcbb9af2ecdcaa674a');
    console.log('📋 Found:', workflow.name);
    
    // Parse reactFlowData
    let reactFlowData = workflow.reactFlowData;
    if (typeof reactFlowData === 'string') {
      reactFlowData = JSON.parse(reactFlowData);
    }
    
    // Find and update gemini/static node to groq
    const targetNode = reactFlowData.nodes.find(n => n.id === 'gemini-1765516888069');
    if (targetNode) {
      console.log(`\n🔄 Updating node ${targetNode.id}:`);
      console.log(`   Current type: ${targetNode.type}`);
      
      // Change type to groq
      targetNode.type = 'groq';
      targetNode.data.label = 'groq';
      
      // Keep existing config but change model
      if (!targetNode.data.model) {
        targetNode.data.model = 'llama-3.3-70b';
      }
      
      console.log(`   New type: groq`);
      console.log(`   Model: ${targetNode.data.model}`);
      
      // Save back
      workflow.reactFlowData = JSON.stringify(reactFlowData);
      await workflow.save();
      
      console.log('\n✅ Updated successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Get Groq API key from https://console.groq.com');
      console.log('2. Update GROQ_API_KEY in .env file');
      console.log('3. Rebuild worker: cd hello-temporal && npm run build');
      console.log('4. Rebuild backend: cd apps/backend-api && npm run build');
      console.log('5. Restart services');
    } else {
      console.log('❌ Node not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateToGroq();

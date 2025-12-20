const axios = require('axios');

async function updateGeminiKey() {
  try {
    const newKey = 'AIzaSyAO1m_ohv7eqXbwFcbtMFyLTJeZayNRFbg';
    
    // Get all workflows - try different userIds
    console.log('📊 Fetching workflows...');
    
    // Try workflow IDs as userIds (based on logs)
    const userIds = [
      '692c76afb5dcf9edd01e9547',  // Old workflow
      '693ba5dcbb9af2ecdcaa674a',  // New workflow
      '6929c59ba1641d9ee7c7d842',  // Another workflow
    ];
    
    let response;
    let workflows = [];
    
    for (const userId of userIds) {
      try {
        const resp = await axios.get(`http://localhost:3001/api/workflows?userId=${userId}`);
        if (resp.data.workflows && resp.data.workflows.length > 0) {
          workflows.push(...resp.data.workflows);
          console.log(`   Found ${resp.data.workflows.length} workflow(s) for userId: ${userId}`);
        }
      } catch (e) {
        console.log(`   No workflows for userId: ${userId}`);
      }
    }
    
    console.log(`\nTotal: ${workflows.length} workflows`);
    
    if (workflows.length === 0) {
      console.log('❌ No workflows found!');
      return;
    }
    
    // Check response format (removed old code)
    
    // Find workflows with Gemini nodes
    for (const workflow of workflows) {
      const geminiNodes = workflow.reactFlowData?.nodes?.filter(n => n.type === 'gemini') || [];
      
      if (geminiNodes.length === 0) continue;
      
      console.log(`\n📋 Workflow: ${workflow.name} (${workflow._id || workflow.id})`);
      console.log(`   Found ${geminiNodes.length} Gemini node(s)`);
      
      let updated = false;
      
      // Update each Gemini node
      for (const node of geminiNodes) {
        const oldKey = node.data?.apiKey || 'N/A';
        if (oldKey !== newKey) {
          console.log(`   🔧 Updating ${node.id}: ${oldKey.substring(0, 20)}... → ${newKey.substring(0, 20)}...`);
          node.data.apiKey = newKey;
          updated = true;
        } else {
          console.log(`   ✅ ${node.id}: Already has new key`);
        }
      }
      
      if (updated) {
        // Save workflow
        const workflowId = workflow._id || workflow.id;
        console.log(`   💾 Saving workflow ${workflowId}...`);
        
        await axios.put(`http://localhost:3001/api/workflows/${workflowId}`, workflow);
        console.log(`   ✅ Updated successfully!`);
      }
    }
    
    console.log('\n✨ Done! All Gemini nodes updated with new API key.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

updateGeminiKey();

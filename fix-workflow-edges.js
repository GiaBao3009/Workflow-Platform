const axios = require('axios');

async function fixWorkflowEdges() {
  try {
    // 1. Get workflow từ API
    const listResponse = await axios.get('http://localhost:3001/api/workflows');
    const workflows = Array.isArray(listResponse.data) ? listResponse.data : [listResponse.data];
    
    console.log('Response:', JSON.stringify(listResponse.data, null, 2).substring(0, 200));
    
    if (workflows.length === 0) {
      console.log('❌ No workflows found');
      return;
    }
    
    console.log(`📊 Found ${workflows.length} workflow(s)`);
    
    // Find workflow có ContentFilter
    const workflow = workflows.find(w => 
      w.reactFlowData?.nodes?.some(n => n.type === 'contentFilter')
    );
    
    if (!workflow) {
      console.log('❌ No ContentFilter workflow found');
      return;
    }
    
    console.log(`\n✅ Found workflow: ${workflow.name} (ID: ${workflow.id})`);
    
    const nodes = workflow.reactFlowData.nodes;
    const edges = workflow.reactFlowData.edges;
    
    console.log(`\n📊 Current edges (${edges.length}):`);
    edges.forEach(edge => {
      console.log(`   ${edge.source} --[${edge.sourceHandle || 'MISSING'}]--> ${edge.target}`);
    });
    
    // Find ContentFilter node
    const filterNode = nodes.find(n => n.type === 'contentFilter');
    if (!filterNode) {
      console.log('❌ ContentFilter node not found');
      return;
    }
    
    console.log(`\n🔍 ContentFilter node: ${filterNode.id}`);
    
    // Find edges từ ContentFilter
    const filterEdges = edges.filter(e => e.source === filterNode.id);
    console.log(`📌 Edges from ContentFilter: ${filterEdges.length}`);
    
    if (filterEdges.length !== 2) {
      console.log('⚠️  Expected 2 edges (pass + reject), found:', filterEdges.length);
    }
    
    // Fix edges: Thêm sourceHandle
    let fixed = false;
    const fixedEdges = edges.map(edge => {
      if (edge.source === filterNode.id && !edge.sourceHandle) {
        const targetNode = nodes.find(n => n.id === edge.target);
        
        // Heuristic: Nếu target là Gemini → đây là nhánh PASS
        //            Nếu target là Telegram → đây là nhánh REJECT
        if (targetNode?.type === 'gemini') {
          console.log(`🔧 Fixing edge to Gemini → sourceHandle = 'pass'`);
          fixed = true;
          return { ...edge, sourceHandle: 'pass' };
        } else if (targetNode?.type === 'telegram') {
          console.log(`🔧 Fixing edge to Telegram → sourceHandle = 'reject'`);
          fixed = true;
          return { ...edge, sourceHandle: 'reject' };
        }
      }
      return edge;
    });
    
    if (!fixed) {
      console.log('\n✅ Edges already have sourceHandle - no fix needed');
      return;
    }
    
    // Update workflow
    const updatedWorkflow = {
      ...workflow,
      reactFlowData: {
        ...workflow.reactFlowData,
        edges: fixedEdges
      }
    };
    
    console.log('\n🚀 Updating workflow...');
    
    const updateResponse = await axios.put(
      `http://localhost:3001/api/workflows/${workflow.id}`,
      updatedWorkflow
    );
    
    console.log('✅ Workflow updated successfully!');
    console.log('\n📊 New edges:');
    fixedEdges.filter(e => e.source === filterNode.id).forEach(edge => {
      console.log(`   ${edge.source} --[${edge.sourceHandle}]--> ${edge.target}`);
    });
    
    console.log('\n✨ Now test again by sending a message to Telegram bot!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fixWorkflowEdges();

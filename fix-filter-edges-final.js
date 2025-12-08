const axios = require('axios');

async function fixFilterEdges() {
  try {
    // 1. Get workflow
    const listResponse = await axios.get('http://localhost:3001/api/workflows?userId=692c76afb5dcf9edd01e9547');
    const workflows = listResponse.data.workflows || [];
    
    console.log(`📊 Found ${workflows.length} workflows`);
    
    const workflow = workflows.find(w => 
      w.reactFlowData?.nodes?.some(n => n.id === 'contentFilter-1764521662706')
    );
    
    if (!workflow) {
      console.log('❌ Workflow with contentFilter-1764521662706 not found');
      console.log('Available workflows:', workflows.map(w => ({
        id: w._id,
        name: w.name,
        nodes: w.reactFlowData?.nodes?.length || 0
      })));
      return;
    }
    
    console.log(`\n✅ Found workflow: ${workflow.name}`);
    
    const nodes = workflow.reactFlowData.nodes;
    const edges = workflow.reactFlowData.edges;
    
    // Find nodes
    const filter1 = nodes.find(n => n.id === 'contentFilter-1764521662706');
    const filter2 = nodes.find(n => n.id === 'contentFilter-1764763109206');
    const sheets = nodes.find(n => n.id === 'googleSheets-1764763086789');
    const telegram1 = nodes.find(n => n.id === 'telegram-1764521676036');
    const telegram2 = nodes.find(n => n.id === 'telegram-1764521686357');
    
    console.log(`\n📊 Nodes found:`);
    console.log(`  Filter #1: ${filter1 ? '✅' : '❌'}`);
    console.log(`  Filter #2: ${filter2 ? '✅' : '❌'}`);
    console.log(`  Google Sheets: ${sheets ? '✅' : '❌'}`);
    console.log(`  Telegram #1: ${telegram1 ? '✅' : '❌'}`);
    console.log(`  Telegram #2: ${telegram2 ? '✅' : '❌'}`);
    
    // Current edges
    console.log(`\n📋 Current edges (${edges.length}):`);
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      console.log(`  ${sourceNode?.data?.label || edge.source} --[${edge.sourceHandle || 'default'}]--> ${targetNode?.data?.label || edge.target}`);
    });
    
    // ĐÚNG LOGIC (theo doc):
    // Filter #1 check {{gemini-1.isFeedback}} vs keyword "true"
    //   - PASS (không tìm thấy "true") = isFeedback=false = câu hỏi thường → Telegram #1
    //   - REJECT (tìm thấy "true") = isFeedback=true = feedback → Google Sheets + Filter #2
    
    // Filter #2 check {{gemini-1.rawResponse}} vs "sentiment": "negative"
    //   - PASS (không tìm thấy negative) = positive → Telegram #1
    //   - REJECT (tìm thấy negative) = negative → Telegram #2
    
    console.log(`\n🔧 Fixing edges...`);
    
    // Remove all existing edges
    workflow.reactFlowData.edges = [];
    
    // 1. Gemini → Filter #1
    workflow.reactFlowData.edges.push({
      id: 'edge-gemini-filter1',
      source: 'gemini-1764521667996',
      target: 'contentFilter-1764521662706',
      sourceHandle: null,
      targetHandle: null
    });
    
    // 2. Filter #1 PASS → Telegram #1 (câu hỏi thường)
    workflow.reactFlowData.edges.push({
      id: 'edge-filter1-pass-telegram1',
      source: 'contentFilter-1764521662706',
      sourceHandle: 'pass',
      target: 'telegram-1764521676036',
      targetHandle: null
    });
    
    // 3. Filter #1 REJECT → Google Sheets (feedback)
    workflow.reactFlowData.edges.push({
      id: 'edge-filter1-reject-sheets',
      source: 'contentFilter-1764521662706',
      sourceHandle: 'reject',
      target: 'googleSheets-1764763086789',
      targetHandle: null
    });
    
    // 4. Google Sheets → Filter #2
    workflow.reactFlowData.edges.push({
      id: 'edge-sheets-filter2',
      source: 'googleSheets-1764763086789',
      target: 'contentFilter-1764763109206',
      sourceHandle: null,
      targetHandle: null
    });
    
    // 5. Filter #2 PASS → Telegram #1 (feedback positive)
    workflow.reactFlowData.edges.push({
      id: 'edge-filter2-pass-telegram1',
      source: 'contentFilter-1764763109206',
      sourceHandle: 'pass',
      target: 'telegram-1764521676036',
      targetHandle: null
    });
    
    // 6. Filter #2 REJECT → Telegram #2 (feedback negative)
    workflow.reactFlowData.edges.push({
      id: 'edge-filter2-reject-telegram2',
      source: 'contentFilter-1764763109206',
      sourceHandle: 'reject',
      target: 'telegram-1764521686357',
      targetHandle: null
    });
    
    console.log(`\n✅ New edges (${workflow.reactFlowData.edges.length}):`);
    workflow.reactFlowData.edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      console.log(`  ${sourceNode?.data?.label || edge.source} --[${edge.sourceHandle || 'default'}]--> ${targetNode?.data?.label || edge.target}`);
    });
    
    // Save
    console.log(`\n💾 Saving workflow...`);
    const updateResponse = await axios.put(
      `http://localhost:3001/api/workflows/${workflow._id}`,
      workflow
    );
    
    console.log(`✅ SUCCESS! Workflow edges fixed.`);
    console.log(`\n📋 LOGIC MỚI (ĐÚNG):`);
    console.log(`  1. Gemini → Filter #1`);
    console.log(`  2. Filter #1 PASS (câu hỏi) → Telegram #1`);
    console.log(`  3. Filter #1 REJECT (feedback) → Google Sheets`);
    console.log(`  4. Google Sheets → Filter #2`);
    console.log(`  5. Filter #2 PASS (positive) → Telegram #1`);
    console.log(`  6. Filter #2 REJECT (negative) → Telegram #2`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixFilterEdges();

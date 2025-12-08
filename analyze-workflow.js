const axios = require('axios');

async function analyzeWorkflowNodes() {
  try {
    // Get workflow
    const listResponse = await axios.get('http://localhost:3001/api/workflows');
    const workflows = listResponse.data.workflows || [];
    
    const workflow = workflows.find(w => 
      w.reactFlowData?.nodes?.some(n => n.type === 'contentFilter')
    );
    
    if (!workflow) {
      console.log('❌ Workflow not found');
      return;
    }
    
    console.log(`\n📋 WORKFLOW: ${workflow.name}`);
    console.log(`   ID: ${workflow._id || workflow.id}`);
    console.log(`   Status: ${workflow.status}`);
    
    const nodes = workflow.reactFlowData.nodes;
    const edges = workflow.reactFlowData.edges;
    
    console.log(`\n📊 Total: ${nodes.length} nodes, ${edges.length} edges`);
    
    // Phân loại nodes
    const nodesByType = {};
    nodes.forEach(node => {
      if (!nodesByType[node.type]) {
        nodesByType[node.type] = [];
      }
      nodesByType[node.type].push(node);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📦 CHI TIẾT TỪNG NODE');
    console.log('='.repeat(80));
    
    // Input node
    if (nodesByType['input']) {
      nodesByType['input'].forEach(node => {
        console.log(`\n🟢 [START] Input Node`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Vị trí: (${node.position.x}, ${node.position.y})`);
      });
    }
    
    // ContentFilter
    if (nodesByType['contentFilter']) {
      nodesByType['contentFilter'].forEach(node => {
        console.log(`\n🛡️  [FILTER] Content Filter`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Vị trí: (${node.position.x}, ${node.position.y})`);
        console.log(`   Config:`);
        console.log(`     - Kiểm tra: {{webhook.message.text}}`);
        console.log(`     - Keywords: ${node.data.keywords?.length || 0} từ cấm`);
        console.log(`       ${node.data.keywords?.slice(0, 5).join(', ')}...`);
        console.log(`     - Reject message: "${node.data.rejectionMessage}"`);
        console.log(`     - Case sensitive: ${node.data.caseSensitive}`);
        console.log(`   Handles:`);
        console.log(`     - LEFT (pass): Nội dung sạch → tiếp tục`);
        console.log(`     - RIGHT (reject): Có từ cấm → warning`);
      });
    }
    
    // Gemini
    if (nodesByType['gemini']) {
      nodesByType['gemini'].forEach(node => {
        console.log(`\n✨ [AI] Gemini AI`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Vị trí: (${node.position.x}, ${node.position.y})`);
        console.log(`   Config:`);
        console.log(`     - Model: ${node.data.model}`);
        console.log(`     - System prompt: "${node.data.systemPrompt?.substring(0, 50)}..."`);
        console.log(`     - User message: ${node.data.userMessage}`);
        console.log(`     - Max tokens: ${node.data.maxTokens}`);
        console.log(`     - Temperature: ${node.data.temperature}`);
        console.log(`   Output: {{gemini-1.response}}`);
      });
    }
    
    // Telegram nodes
    if (nodesByType['telegram']) {
      nodesByType['telegram'].forEach((node, index) => {
        console.log(`\n📱 [TELEGRAM ${index + 1}] Telegram Message`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Vị trí: (${node.position.x}, ${node.position.y})`);
        console.log(`   Config:`);
        console.log(`     - Chat ID: ${node.data.chatId}`);
        console.log(`     - Text: "${node.data.text}"`);
        console.log(`     - Parse mode: ${node.data.parseMode || 'None'}`);
        
        // Xác định mục đích của node này
        if (node.data.text?.includes('{{gemini-1.response}}')) {
          console.log(`   Mục đích: Gửi AI response (nhánh PASS)`);
        } else if (node.data.text?.includes('không hỗ trợ') || node.data.text?.includes('cảnh báo')) {
          console.log(`   Mục đích: Gửi warning (nhánh REJECT)`);
        }
      });
    }
    
    // Output node
    if (nodesByType['output']) {
      nodesByType['output'].forEach(node => {
        console.log(`\n🔴 [END] Output Node`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Vị trí: (${node.position.x}, ${node.position.y})`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔗 EDGES (KẾT NỐI)');
    console.log('='.repeat(80));
    
    edges.forEach((edge, index) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      const sourceType = sourceNode?.type || 'unknown';
      const targetType = targetNode?.type || 'unknown';
      
      console.log(`\n${index + 1}. ${sourceType.toUpperCase()} → ${targetType.toUpperCase()}`);
      console.log(`   Source: ${edge.source}`);
      console.log(`   Target: ${edge.target}`);
      console.log(`   Handle: ${edge.sourceHandle || 'NONE'} ${edge.sourceHandle ? (edge.sourceHandle === 'pass' ? '(✅ PASS)' : '(❌ REJECT)') : '(⚠️ NO CONDITION)'}`);
      
      if (!edge.sourceHandle && sourceType === 'contentFilter') {
        console.log(`   ⚠️  WARNING: Edge từ ContentFilter cần có sourceHandle!`);
      }
      if (!edge.sourceHandle && sourceType === 'gemini') {
        console.log(`   ⚠️  WARNING: Edge từ Gemini không có condition → node sẽ luôn chạy!`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 PHÂN TÍCH LUỒNG');
    console.log('='.repeat(80));
    
    const filterNode = nodes.find(n => n.type === 'contentFilter');
    const geminiNode = nodes.find(n => n.type === 'gemini');
    const telegramNodes = nodes.filter(n => n.type === 'telegram');
    
    if (filterNode && geminiNode && telegramNodes.length >= 2) {
      console.log('\n📌 Workflow hiện tại:');
      console.log('   Webhook → ContentFilter');
      
      const passEdges = edges.filter(e => e.source === filterNode.id && e.sourceHandle === 'pass');
      const rejectEdges = edges.filter(e => e.source === filterNode.id && e.sourceHandle === 'reject');
      const geminiEdges = edges.filter(e => e.source === geminiNode.id);
      
      console.log(`\n   📍 Nhánh PASS (${passEdges.length} edges):`);
      passEdges.forEach(e => {
        const target = nodes.find(n => n.id === e.target);
        console.log(`      → ${target?.type} (${e.target})`);
      });
      
      console.log(`\n   📍 Nhánh REJECT (${rejectEdges.length} edges):`);
      rejectEdges.forEach(e => {
        const target = nodes.find(n => n.id === e.target);
        console.log(`      → ${target?.type} (${e.target})`);
      });
      
      console.log(`\n   📍 Sau Gemini (${geminiEdges.length} edges):`);
      geminiEdges.forEach(e => {
        const target = nodes.find(n => n.id === e.target);
        console.log(`      → ${target?.type} (${e.target}) [⚠️ KHÔNG CÓ CONDITION]`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('💡 KHUYẾN NGHỊ');
      console.log('='.repeat(80));
      
      if (geminiEdges.length > 0) {
        console.log('\n❌ VẤN ĐỀ: Có edge từ Gemini → Telegram mà không có condition');
        console.log('   → Telegram này sẽ LUÔN CHẠY kể cả khi Gemini bị skip');
        console.log('   → Dẫn đến gửi "{{gemini-1.response}}" khi filter reject');
        
        console.log('\n✅ GIẢI PHÁP: Cấu trúc đúng phải là:');
        console.log('   Webhook → ContentFilter');
        console.log('     ├─ LEFT (pass) → Gemini');
        console.log('     ├─ LEFT (pass) → Telegram (text: {{gemini-1.response}})');
        console.log('     └─ RIGHT (reject) → Telegram (text: "không hỗ trợ")');
        
        console.log('\n🔧 CÁC BƯỚC SỬA:');
        console.log('   1. XÓA edge: Gemini → Telegram');
        console.log('   2. THÊM edge: ContentFilter (LEFT handle) → Telegram (có text {{gemini-1.response}})');
        console.log('   3. Giữ nguyên: ContentFilter (LEFT) → Gemini');
        console.log('   4. Giữ nguyên: ContentFilter (RIGHT) → Telegram (warning)');
      } else {
        console.log('\n✅ Cấu trúc workflow OK!');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

analyzeWorkflowNodes();

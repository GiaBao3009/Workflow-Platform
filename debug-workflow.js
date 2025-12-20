/**
 * Debug workflow config
 */

const axios = require('axios');

const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';
const BACKEND_URL = 'http://localhost:3001';

async function debugWorkflow() {
  try {
    console.log('🔍 Fetching workflow config...\n');
    
    const response = await axios.get(`${BACKEND_URL}/api/workflows/${WORKFLOW_ID}`);
    const workflow = response.data;
    
    console.log('📋 Workflow:', workflow.name);
    console.log('📊 Total nodes:', workflow.reactFlowData.nodes.length);
    console.log('🔗 Total edges:', workflow.reactFlowData.edges.length);
    
    console.log('\n🔍 Checking Telegram nodes...\n');
    
    const telegramNodes = workflow.reactFlowData.nodes.filter(n => n.type === 'telegram');
    
    telegramNodes.forEach((node, i) => {
      console.log(`${i + 1}. Telegram Node: ${node.id}`);
      console.log(`   Chat ID: ${node.data.chatId}`);
      console.log(`   Text: ${node.data.text?.substring(0, 80)}${node.data.text?.length > 80 ? '...' : ''}`);
      
      // Validate
      const issues = [];
      if (!node.data.chatId) issues.push('❌ Missing chatId');
      if (!node.data.text) issues.push('❌ Missing text');
      if (node.data.chatId && node.data.chatId.length > 100) issues.push('⚠️ chatId looks like text (too long)');
      if (node.data.text && /^\d+$/.test(node.data.text)) issues.push('⚠️ text looks like ID (only numbers)');
      
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log('   ✅ Config looks OK');
      }
      console.log('');
    });
    
    console.log('\n🔍 Checking Groq nodes...\n');
    
    const groqNodes = workflow.reactFlowData.nodes.filter(n => n.type === 'groq');
    
    groqNodes.forEach((node, i) => {
      console.log(`${i + 1}. Groq Node: ${node.id}`);
      console.log(`   Model: ${node.data.model}`);
      console.log(`   System Prompt: ${node.data.systemPrompt ? '✓ Set' : '✗ Missing'}`);
      console.log(`   User Message: ${node.data.userMessage}`);
      console.log(`   Conversation History: ${node.data.useConversationHistory ? '✓ Enabled' : '✗ Disabled'}`);
      console.log('');
    });
    
    console.log('\n🔍 Checking Filter nodes...\n');
    
    const filterNodes = workflow.reactFlowData.nodes.filter(n => n.type === 'contentFilter');
    
    filterNodes.forEach((node, i) => {
      console.log(`${i + 1}. Filter Node: ${node.id}`);
      console.log(`   Input Text: ${node.data.inputText?.substring(0, 80)}${node.data.inputText?.length > 80 ? '...' : ''}`);
      console.log(`   Keywords: ${node.data.keywords?.join(', ')}`);
      console.log('');
    });
    
    console.log('\n🔗 Edge Connections:\n');
    
    workflow.reactFlowData.edges.forEach(edge => {
      const sourceNode = workflow.reactFlowData.nodes.find(n => n.id === edge.source);
      const targetNode = workflow.reactFlowData.nodes.find(n => n.id === edge.target);
      
      console.log(`${sourceNode?.type || edge.source} → [${edge.sourceHandle || 'none'}] → ${targetNode?.type || edge.target}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('1. Check if any ❌ or ⚠️ issues above');
    console.log('2. Make sure workflow is deployed (not just saved)');
    console.log('3. Send a test message to bot');
    console.log('4. Paste worker logs here\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugWorkflow();

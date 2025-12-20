const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
const WORKFLOW_ID = '693ba5dcbb9af2ecdcaa674a';

async function checkSheetsConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-platform');
    
    // Try both ObjectId and string
    let workflow = await db.collection('workflows').findOne({ _id: new ObjectId(WORKFLOW_ID) });
    if (!workflow) {
      workflow = await db.collection('workflows').findOne({ _id: WORKFLOW_ID });
    }
    
    if (!workflow) {
      console.log('❌ Workflow not found!');
      return;
    }
    
    console.log(`\n📋 Workflow: ${workflow.name}\n`);
    
    const sheetsNodes = workflow.nodes.filter(n => n.type === 'GOOGLE_SHEETS');
    
    if (sheetsNodes.length === 0) {
      console.log('❌ No Google Sheets nodes found!');
      return;
    }
    
    sheetsNodes.forEach((node, i) => {
      console.log(`\n📊 Google Sheets Node ${i + 1}:`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Alias: ${node.alias || 'N/A'}`);
      console.log(`\n   Config:`);
      console.log(`   - spreadsheetId: ${node.config.spreadsheetId}`);
      console.log(`   - action: ${node.config.action}`);
      console.log(`   - sheetName: "${node.config.sheetName}"`);
      console.log(`   - range: "${node.config.range}"`);
      console.log(`\n   ⚠️  ISSUE: Range format is "${node.config.range}"`);
      console.log(`   Expected: Should be full range like "A1:F" or just columns "A:F"`);
      console.log(`   Current format "${node.config.sheetName}!${node.config.range}" may not work`);
      
      if (node.config.values) {
        console.log(`\n   Values template:`);
        console.log(`   ${JSON.stringify(node.config.values, null, 2)}`);
      }
    });
    
    console.log(`\n\n💡 SOLUTION:`);
    console.log(`   Change range from "A:F" to "A1:F1000" or remove sheetName prefix`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkSheetsConfig();

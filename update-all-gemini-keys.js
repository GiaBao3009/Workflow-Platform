const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
const NEW_GEMINI_KEY = 'AIzaSyCJbszinImGRTEXYroaXBgW3n3q-ZzT134';

async function updateAllGeminiKeys() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('workflow-db');
    const workflowsCollection = db.collection('workflows');
    
    // Tìm tất cả workflows có Gemini node
    const workflows = await workflowsCollection.find({
      'nodes.type': 'GEMINI'
    }).toArray();
    
    console.log(`\n📊 Found ${workflows.length} workflows with Gemini nodes`);
    
    let updatedCount = 0;
    
    for (const workflow of workflows) {
      let hasUpdate = false;
      
      // Update Gemini API key in each node config
      workflow.nodes.forEach(node => {
        if (node.type === 'GEMINI' && node.config) {
          // Check if config has apiKey field
          if (node.config.apiKey !== undefined) {
            node.config.apiKey = NEW_GEMINI_KEY;
            hasUpdate = true;
            console.log(`   ✏️  Updated node ${node.id} in workflow ${workflow._id}`);
          }
        }
      });
      
      if (hasUpdate) {
        await workflowsCollection.updateOne(
          { _id: workflow._id },
          { $set: { nodes: workflow.nodes, updatedAt: new Date() } }
        );
        updatedCount++;
        console.log(`   ✅ Saved workflow ${workflow._id}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} workflows with new Gemini API key`);
    console.log(`🔑 New key: ${NEW_GEMINI_KEY.substring(0, 20)}...`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

updateAllGeminiKeys();

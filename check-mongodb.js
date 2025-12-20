const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  try {
    const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';
    const client = new MongoClient(uri);
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected!');
    
    const db = client.db('workflow-platform'); // Default DB name from backend
    
    // List all workflows
    console.log('\n📊 Workflows:');
    const workflows = await db.collection('workflows').find({}).toArray();
    console.log(`Found ${workflows.length} workflow(s)`);
    
    workflows.forEach(w => {
      console.log(`\n  📋 ${w.name || 'Untitled'} (${w._id})`);
      console.log(`     User: ${w.userId}`);
      console.log(`     Nodes: ${w.reactFlowData?.nodes?.length || 0}`);
      console.log(`     Status: ${w.status || 'unknown'}`);
    });
    
    // Find workflow 692c76afb5dcf9edd01e9547
    console.log('\n🔍 Looking for workflow 692c76afb5dcf9edd01e9547...');
    const targetWorkflow = await db.collection('workflows').findOne({ 
      _id: '692c76afb5dcf9edd01e9547' 
    });
    
    if (targetWorkflow) {
      console.log('✅ Found!');
      console.log('   Name:', targetWorkflow.name);
      console.log('   Nodes:', targetWorkflow.reactFlowData?.nodes?.map(n => n.data?.label || n.type).join(', '));
    } else {
      console.log('❌ Not found - might be using ObjectId format');
      
      // Try with ObjectId
      const { ObjectId } = require('mongodb');
      const targetWithObjectId = await db.collection('workflows').findOne({ 
        _id: new ObjectId('692c76afb5dcf9edd01e9547') 
      });
      
      if (targetWithObjectId) {
        console.log('✅ Found with ObjectId!');
        console.log('   Name:', targetWithObjectId.name);
      }
    }
    
    await client.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMongoDB();

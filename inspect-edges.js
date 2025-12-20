const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db';

(async () => {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('workflow-db');
    
    const workflow = await db.collection('workflows').findOne({
      _id: new ObjectId('693ba5dcbb9af2ecdcaa674a')
    });
    
    console.log('\n📋 WORKFLOW:', workflow.name);
    console.log('   Nodes:', workflow.nodes.length);
    console.log('   Edges:', workflow.edges.length);
    
    console.log('\n🔧 NODES:');
    workflow.nodes.forEach((n, i) => {
      console.log(`   ${i+1}. ${n.type} (${n.id})`);
    });
    
    console.log('\n🔀 EDGES:');
    workflow.edges.forEach((e, i) => {
      const src = workflow.nodes.find(n => n.id === e.source);
      const tgt = workflow.nodes.find(n => n.id === e.target);
      console.log(`\n   ${i+1}. ${src?.type} → ${tgt?.type}`);
      if (e.condition) {
        console.log(`      Condition: ${e.condition.nodeId} = "${e.condition.value}"`);
      }
    });
    
    // Check ContentFilter routing
    const filter = workflow.nodes.find(n => n.type === 'CONTENT_FILTER');
    if (filter) {
      console.log('\n\n⚠️  CONTENTFILTER ROUTING:');
      const filterEdges = workflow.edges.filter(e => e.source === filter.id);
      filterEdges.forEach(e => {
        const tgt = workflow.nodes.find(n => n.id === e.target);
        const cond = e.condition?.value || 'always';
        console.log(`   ${cond} → ${tgt?.type}`);
        
        if (cond === 'pass' && tgt?.type === 'GOOGLE_SHEETS') {
          console.log('   ❌❌❌ SAI RỒI! PASS phải đi TELEGRAM!');
        }
        if (cond === 'reject' && tgt?.type === 'TELEGRAM') {
          console.log('   ❌❌❌ SAI RỒI! REJECT phải đi SHEETS!');
        }
      });
    }
    
    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

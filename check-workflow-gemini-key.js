const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://workflow_admin:WorkflowPlatform2025@cluster0.a8aqruk.mongodb.net/workflow-db?appName=Cluster0';

async function checkGeminiKey() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('workflow-db');
        const workflowsCollection = db.collection('workflows');
        
        const workflowId = '693ba5dcbb9af2ecdcaa674a';
        
        // Count workflows
        const count = await workflowsCollection.countDocuments();
        console.log(`\n===== Total Workflows: ${count} =====`);
        
        // List all workflows first
        const allWorkflows = await workflowsCollection.find({}).limit(10).toArray();
        console.log('\n===== All Workflows =====');
        allWorkflows.forEach(w => {
            console.log(`\nID: ${w._id}`);
            console.log(`Name: ${w.name}`);
            console.log(`Status: ${w.status}`);
        });
        
        const workflow = await workflowsCollection.findOne({ 
            _id: workflowId
        });
        
        if (!workflow) {
            console.log(`Workflow ${workflowId} not found`);
            return;
        }
        
        console.log('\n===== Workflow Config =====');
        console.log(`Name: ${workflow.name}`);
        console.log(`Status: ${workflow.status}`);
        console.log(`\nNodes with Gemini/API config:`);
        
        workflow.config.nodes.forEach(node => {
            if (node.type === 'GEMINI' || node.data?.config?.apiKey) {
                console.log(`\n- Node ${node.id} (${node.type}):`);
                console.log(`  Config:`, JSON.stringify(node.data?.config || {}, null, 2));
            }
        });
        
    } finally {
        await client.close();
    }
}

checkGeminiKey().catch(console.error);

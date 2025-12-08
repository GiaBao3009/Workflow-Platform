// src/client.ts
import { Connection, Client } from '@temporalio/client';
import { executeWorkflow } from './workflows';

async function run() {
  // 1. Kết nối tới Temporal Server (đang chạy ở localhost:7233)
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  // 2. Gửi lệnh Start Workflow
  const handle = await client.workflow.start(executeWorkflow, {
    // Phải khớp với taskQueue bên Worker
    taskQueue: 'workflow-queue',
    // Tham số truyền vào workflow
    args: ['test-workflow', []], 
    // ID duy nhất cho lần chạy này
    workflowId: 'workflow-id-' + Date.now(), 
  });

  console.log(`Đã start workflow ID: ${handle.workflowId}`);
  
  // 3. Chờ kết quả trả về (Optional)
  const result = await handle.result();
  console.log(`Kết quả nhận được:`, result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
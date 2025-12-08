// src/worker.ts
// CRITICAL: Load .env BEFORE any imports (use require, not import)
import * as path from 'path';
const envPath = path.resolve(__dirname, '../.env');
console.log(`[Worker] Loading .env from: ${envPath}`);
require('dotenv').config({ path: envPath });
console.log(`[Worker] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'LOADED ✅ (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NOT FOUND ❌'}`);
console.log(`[Worker] TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? 'LOADED ✅' : 'NOT FOUND ❌'}`);

// Now import after .env is loaded
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // 1. Kết nối Worker với Temporal Server và đăng ký Activities/Workflows
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'), // Đường dẫn file workflow
    activities, // Object chứa các activities
    taskQueue: 'workflow-queue', // Tên hàng đợi (Quan trọng!)
  });

  console.log('Worker đã khởi động. Đang chờ việc...');
  
  // 2. Bắt đầu lắng nghe
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
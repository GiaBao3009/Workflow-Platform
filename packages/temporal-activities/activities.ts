/**
 * Temporal Activities - Các hành động thực tế được gọi
 * Mỗi Activity tương ứng với một loại Node trong React Flow
 */

import { Activity, Context } from '@temporalio/activity';
import axios from 'axios';
import { MongoClient } from 'mongodb';

interface ActivityContext {
  workflowId: string;
  runId: string;
  previousResults?: Record<string, any>;
}

// ==================== HTTP REQUEST ACTIVITY ====================
export const executeHttpRequestActivity = async (
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: Record<string, any>;
    timeout?: number;
  },
  context: ActivityContext
): Promise<any> => {
  try {
    console.log(`[HTTP Activity] Gửi ${config.method} request tới ${config.url}`);

    const response = await axios({
      url: config.url,
      method: config.method,
      headers: config.headers || {},
      data: config.body,
      timeout: config.timeout || 30000,
    });

    console.log(`[HTTP Activity] Thành công, status: ${response.status}`);

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
    };
  } catch (error: any) {
    console.error(`[HTTP Activity] Lỗi:`, error.message);
    throw new Error(`HTTP Request failed: ${error.message}`);
  }
};

// ==================== MONGODB WRITE ACTIVITY ====================
export const mongoDBWriteActivity = async (
  config: {
    collection: string;
    operation: 'insertOne' | 'updateOne' | 'replaceOne' | 'insertMany';
    filter?: Record<string, any>; // Cho updateOne/replaceOne
    data: Record<string, any> | Record<string, any>[]; // Document hoặc array documents
  },
  context: ActivityContext
): Promise<any> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  let client: MongoClient | null = null;

  try {
    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    const collection = db.collection(config.collection);

    let result;

    switch (config.operation) {
      case 'insertOne':
        result = await collection.insertOne(config.data as Record<string, any>);
        console.log(
          `[MongoDB Activity] Inserted document with ID: ${result.insertedId}`
        );
        return {
          operation: 'insertOne',
          insertedId: result.insertedId,
        };

      case 'insertMany':
        result = await collection.insertMany(
          config.data as Record<string, any>[]
        );
        console.log(
          `[MongoDB Activity] Inserted ${result.insertedCount} documents`
        );
        return {
          operation: 'insertMany',
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        };

      case 'updateOne':
        result = await collection.updateOne(config.filter!, {
          $set: config.data,
        });
        console.log(`[MongoDB Activity] Updated ${result.modifiedCount} documents`);
        return {
          operation: 'updateOne',
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        };

      case 'replaceOne':
        result = await collection.replaceOne(
          config.filter!,
          config.data as Record<string, any>
        );
        console.log(
          `[MongoDB Activity] Replaced ${result.modifiedCount} documents`
        );
        return {
          operation: 'replaceOne',
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        };

      default:
        throw new Error(`Unknown operation: ${config.operation}`);
    }
  } catch (error: any) {
    console.error(`[MongoDB Activity] Lỗi:`, error.message);
    throw new Error(`MongoDB operation failed: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// ==================== MONGODB READ ACTIVITY ====================
export const mongoDBReadActivity = async (
  config: {
    collection: string;
    filter?: Record<string, any>;
    projection?: Record<string, 1 | 0>;
    limit?: number;
    skip?: number;
  },
  context: ActivityContext
): Promise<any> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  let client: MongoClient | null = null;

  try {
    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    const collection = db.collection(config.collection);

    const query = collection.find(config.filter || {});

    if (config.projection) {
      query.project(config.projection);
    }

    if (config.skip) {
      query.skip(config.skip);
    }

    if (config.limit) {
      query.limit(config.limit);
    }

    const result = await query.toArray();
    console.log(
      `[MongoDB Read Activity] Found ${result.length} documents in ${config.collection}`
    );

    return result;
  } catch (error: any) {
    console.error(`[MongoDB Read Activity] Lỗi:`, error.message);
    throw new Error(`MongoDB read operation failed: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// ==================== CONDITIONAL LOGIC ACTIVITY ====================
export const conditionalLogicActivity = async (
  config: {
    condition: string; // Expression như: "$json.http_response.body.status === 'success'"
  },
  context: ActivityContext
): Promise<boolean> => {
  try {
    // Đơn giản hóa: eval expression (trong production, dùng safer evaluator)
    const result = eval(config.condition.replace(/\$json\./g, 'context.'));
    console.log(`[Conditional Activity] Condition result: ${result}`);
    return result;
  } catch (error: any) {
    console.error(`[Conditional Activity] Lỗi:`, error.message);
    throw new Error(`Conditional logic failed: ${error.message}`);
  }
};

// ==================== DELAY ACTIVITY ====================
export const delayActivity = async (
  config: {
    delayMs: number; // Delay time in milliseconds
  },
  context: ActivityContext
): Promise<void> => {
  console.log(`[Delay Activity] Đợi ${config.delayMs}ms...`);
  await new Promise((resolve) => setTimeout(resolve, config.delayMs));
  console.log(`[Delay Activity] Hoàn tất`);
};

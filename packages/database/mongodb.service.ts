/**
 * MongoDB Connection Service
 * Quản lý kết nối tới MongoDB Atlas
 */

import mongoose from 'mongoose';
import logger from '../shared-types/logger';

interface MongoDBConfig {
  uri: string;
  dbName: string;
  maxPoolSize?: number;
  minPoolSize?: number;
}

class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  async connect(config: MongoDBConfig): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB đã được kết nối');
      return;
    }

    try {
      logger.info(`Đang kết nối tới MongoDB: ${config.uri}`);

      await mongoose.connect(config.uri, {
        dbName: config.dbName,
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('✅ Kết nối MongoDB Atlas thành công');

      // Xử lý sự kiện disconnect
      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB bị ngắt kết nối');
        this.isConnected = false;
      });

      mongoose.connection.on('error', (error) => {
        logger.error('❌ MongoDB Connection Error:', error);
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('❌ Lỗi kết nối MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('✅ Đã ngắt kết nối MongoDB');
    } catch (error) {
      logger.error('❌ Lỗi khi ngắt kết nối MongoDB:', error);
      throw error;
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
}

export default MongoDBService;

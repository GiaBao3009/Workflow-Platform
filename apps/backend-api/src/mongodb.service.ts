/**
 * MongoDB Connection Service
 * Quản lý kết nối tới MongoDB Atlas
 */

import mongoose from 'mongoose';

// Structured logger with JSON output
const logger = {
  info: (message: string, meta?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'mongodb-service',
      message,
      ...meta,
    };
    console.log(JSON.stringify(log));
  },
  warn: (message: string, meta?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'mongodb-service',
      message,
      ...meta,
    };
    console.warn(JSON.stringify(log));
  },
  error: (message: string, meta?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'mongodb-service',
      message,
      ...meta,
      stack: meta?.error?.stack || meta?.stack,
    };
    console.error(JSON.stringify(log));
  },
};

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
      logger.info('MongoDB already connected');
      return;
    }

    try {
      logger.info('Connecting to MongoDB', { uri: config.uri.replace(/:[^:]*@/, ':***@') });

      await mongoose.connect(config.uri, {
        dbName: config.dbName,
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully', {
        dbName: config.dbName,
        maxPoolSize: config.maxPoolSize,
      });

      // Xử lý sự kiện disconnect
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error: error.message, stack: error.stack });
        this.isConnected = false;
      });
    } catch (error: any) {
      logger.error('Failed to connect MongoDB', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error: any) {
      logger.error('Failed to disconnect MongoDB', { error: error.message });
      throw error;
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  getDb() {
    return mongoose.connection.db;
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
}

export default MongoDBService;

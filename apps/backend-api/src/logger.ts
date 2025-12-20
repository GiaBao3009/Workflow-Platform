/**
 * Centralized Logger - Structured Logging
 * Sử dụng JSON format để dễ parse và search
 */

export interface LogMetadata {
  correlationId?: string;
  userId?: string;
  workflowId?: string;
  temporalWorkflowId?: string;
  duration?: number;
  error?: any;
  [key: string]: any;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: string, message: string, meta?: LogMetadata) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...meta,
    };

    const output = JSON.stringify(log);

    switch (level) {
      case 'DEBUG':
        if (process.env.LOG_LEVEL === 'debug') {
          console.debug(output);
        }
        break;
      case 'INFO':
        console.log(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  }

  debug(message: string, meta?: LogMetadata) {
    this.log('DEBUG', message, meta);
  }

  info(message: string, meta?: LogMetadata) {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: LogMetadata) {
    this.log('WARN', message, meta);
  }

  error(message: string, meta?: LogMetadata) {
    this.log('ERROR', message, {
      ...meta,
      errorMessage: meta?.error?.message,
      errorStack: meta?.error?.stack,
    });
  }
}

// Export singleton instances
export const logger = new Logger('backend-api');
export const createLogger = (service: string) => new Logger(service);

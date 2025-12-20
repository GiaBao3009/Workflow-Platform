/**
 * Admin Middleware - Bảo vệ các routes dành cho admin
 */

import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../schema.mongodb';

/**
 * Middleware kiểm tra user đã đăng nhập
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Bạn cần đăng nhập để truy cập tài nguyên này' 
    });
  }
  next();
};

/**
 * Middleware kiểm tra user có quyền admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Bạn cần đăng nhập để truy cập tài nguyên này' 
    });
  }

  const userRole = (req.user as any).role;
  if (userRole !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Bạn không có quyền truy cập tài nguyên này' 
    });
  }

  next();
};

/**
 * Middleware ghi audit log cho các actions quan trọng
 */
export const auditLog = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Lưu original send function
    const originalSend = res.json.bind(res);

    // Override send function để capture response
    res.json = function (body: any) {
      // Ghi audit log sau khi response
      if (req.user) {
        const user = req.user as any;
        const logData = {
          userId: user._id || user.id,
          userName: user.name,
          userEmail: user.email,
          action,
          resourceType,
          resourceId: req.params.id || req.params.workflowId || req.params.userId,
          resourceName: body?.name || body?.email || body?.title,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            body: sanitizeBody(req.body),
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed',
          errorMessage: res.statusCode >= 400 ? body?.error || body?.message : undefined,
        };

        // Async log (không block response)
        AuditLog.create(logData).catch(err => {
          console.error('❌ Error creating audit log:', err);
        });
      }

      // Call original send
      return originalSend(body);
    };

    next();
  };
};

/**
 * Sanitize request body để không log sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body) return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'encryptedKey', 'secret'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

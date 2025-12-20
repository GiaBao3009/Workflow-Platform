/**
 * JWT Utilities
 * Tạo và verify JWT tokens cho authentication
 */

import jwt from 'jsonwebtoken';
import { IUser } from '../schema.mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface IJWTPayload {
  userId: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
}

/**
 * Tạo JWT token từ user data
 */
export function generateToken(user: IUser): string {
  const payload: IJWTPayload = {
    userId: user._id,
    email: user.email,
    name: user.name,
    role: (user as any).role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): IJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as IJWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware để xác thực JWT token
 */
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

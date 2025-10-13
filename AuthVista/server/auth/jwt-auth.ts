import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'tadoba-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  role: 'department' | 'local';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Authentication middleware - protects routes
 */
export function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(role: 'department' | 'local') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Extract user ID from authenticated request
 */
export function getUserId(req: AuthRequest): string | null {
  return req.user?.userId || null;
}

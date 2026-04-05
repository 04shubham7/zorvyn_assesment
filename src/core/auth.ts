import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole, UserStatus } from './types';
import { Errors } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * JWT Token management
 */
export const Token = {
  /**
   * Generate JWT token
   */
  generate(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRY,
    } as any);
  },

  /**
   * Verify and decode JWT token
   */
  verify(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw Errors.unauthorized();
    }
  },

  /**
   * Extract token from Authorization header
   */
  extractFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw Errors.unauthorized();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw Errors.unauthorized();
    }

    return parts[1];
  },
};

/**
 * RBAC - Role-Based Access Control Policy
 */
export const RBAC = {
  /**
   * Check if a role can perform an action on an endpoint
   */
  canAccess(role: UserRole | undefined, requiredRoles: UserRole[]): boolean {
    if (!role) {
      return false;
    }
    return requiredRoles.includes(role);
  },

  /**
   * Check if user is active
   */
  isActive(status: UserStatus | undefined): boolean {
    return status === UserStatus.ACTIVE;
  },

  /**
   * Predefined role hierarchies for convenience
   */
  roles: {
    VIEWER: [UserRole.VIEWER],
    ANALYST: [UserRole.ANALYST, UserRole.ADMIN],
    ADMIN: [UserRole.ADMIN],
    ANY: [UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN],
  },
};

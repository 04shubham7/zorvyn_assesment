import { Request, Response, NextFunction } from 'express';
import { Token, RBAC } from '../../core/auth';
import { Errors } from '../../core/errors';
import { UserRole, UserStatus } from '../../core/types';

/**
 * Extend Express Request to include authenticated user context
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

/**
 * Authentication middleware
 * Extracts and verifies JWT token, attaches user context to request
 */
export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = Token.extractFromHeader(authHeader);
    const payload = Token.verify(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      next(error);
    } else {
      next(Errors.unauthorized());
    }
  }
};

/**
 * RBAC middleware factory
 * Restricts access to routes based on user role
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw Errors.unauthorized();
      }

      // Check role
      if (!RBAC.canAccess(req.user.role, allowedRoles)) {
        throw Errors.forbidden();
      }

      // Check if user is active
      if (!RBAC.isActive(req.user.status)) {
        throw Errors.forbidden('User account is inactive');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

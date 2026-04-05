import { Response } from 'express';
import { ApiResponse, ErrorDetail } from './types';

/**
 * Standard error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * AppError: structured error for consistent handling
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Send error response
 */
export const sendError = (res: Response, error: AppError) => {
  const errorDetail: ErrorDetail = {
    code: error.code,
    message: error.message,
  };
  if (error.details && error.details.length > 0) {
    errorDetail.details = error.details;
  }
  const response: ApiResponse<null> = {
    success: false,
    error: errorDetail,
  };
  res.status(error.statusCode).json(response);
};

/**
 * Common error creators
 */
export const Errors = {
  validationError: (message: string, details?: Array<{ field: string; issue: string }>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  unauthorized: (message: string = 'Missing or invalid authentication token') =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message: string = 'Insufficient role permission') =>
    new AppError(ErrorCode.FORBIDDEN, message, 403),

  notFound: (message: string = 'Requested resource not found') =>
    new AppError(ErrorCode.NOT_FOUND, message, 404),

  conflict: (message: string = 'Resource already exists') =>
    new AppError(ErrorCode.CONFLICT, message, 409),

  internalError: (message: string = 'Unexpected server error') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),
};

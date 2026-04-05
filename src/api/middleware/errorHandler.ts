import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../../core/errors';
import { ApiResponse } from '../../core/types';

/**
 * Error handling middleware
 * Catches and formats all errors in a consistent manner
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    sendError(res, error);
  } else {
    // Unhandled error
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
    res.status(500).json(response);
  }
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
};

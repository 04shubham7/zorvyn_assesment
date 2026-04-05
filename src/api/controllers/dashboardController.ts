import { NextFunction, Request, Response } from 'express';
import { APP_CONSTANTS, HTTP_STATUS } from '../../core/constants';
import { Errors } from '../../core/errors';
import { TransactionType } from '../../core/types';
import { Rules, Validator } from '../../core/validation';
import { dashboardService } from '../../services/dashboardService';

type TrendInterval = 'day' | 'week' | 'month';

const validator = new Validator();

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.floor(parsed);
}

function validateDateRange(startDate?: string, endDate?: string) {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw Errors.validationError('Invalid date range', [
      {
        field: 'startDate',
        issue: 'startDate must be less than or equal to endDate',
      },
    ]);
  }
}

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const category = req.query.category as string | undefined;

    validator.reset();
    if (startDate !== undefined) {
      validator.validateField('startDate', startDate, [Rules.isISO8601()]);
    }
    if (endDate !== undefined) {
      validator.validateField('endDate', endDate, [Rules.isISO8601()]);
    }
    if (category !== undefined) {
      validator.validateField('category', category, [Rules.minLength(2), Rules.maxLength(100)]);
    }

    validator.throwIfInvalid('Invalid query parameters');
    validateDateRange(startDate, endDate);

    const data = await dashboardService.getSummary({
      startDate,
      endDate,
      category,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCategoryTotals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = req.query.type as TransactionType | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    validator.reset();
    if (type !== undefined) {
      validator.validateField('type', type, [Rules.isEnum(Object.values(TransactionType))]);
    }
    if (startDate !== undefined) {
      validator.validateField('startDate', startDate, [Rules.isISO8601()]);
    }
    if (endDate !== undefined) {
      validator.validateField('endDate', endDate, [Rules.isISO8601()]);
    }

    validator.throwIfInvalid('Invalid query parameters');
    validateDateRange(startDate, endDate);

    const data = await dashboardService.getCategoryTotals({
      type,
      startDate,
      endDate,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = req.query.type as TransactionType | undefined;
    const limit = parsePositiveInt(
      req.query.limit,
      APP_CONSTANTS.DEFAULT_RECENT_ACTIVITY_LIMIT
    );

    validator
      .reset()
      .validateField('limit', limit, [
        Rules.minValue(1),
        Rules.maxValue(APP_CONSTANTS.MAX_RECENT_ACTIVITY_LIMIT),
      ]);

    if (type !== undefined) {
      validator.validateField('type', type, [Rules.isEnum(Object.values(TransactionType))]);
    }

    validator.throwIfInvalid('Invalid query parameters');

    const data = await dashboardService.getRecentActivity({
      limit,
      type,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardTrends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interval = req.query.interval as TrendInterval | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const type = req.query.type as TransactionType | undefined;

    validator
      .reset()
      .validateField('interval', interval, [
        Rules.required(),
        Rules.isEnum(['day', 'week', 'month']),
      ])
      .validateField('startDate', startDate, [Rules.required(), Rules.isISO8601()])
      .validateField('endDate', endDate, [Rules.required(), Rules.isISO8601()]);

    if (type !== undefined) {
      validator.validateField('type', type, [Rules.isEnum(Object.values(TransactionType))]);
    }

    validator.throwIfInvalid('Invalid query parameters');
    validateDateRange(startDate, endDate);

    const data = await dashboardService.getTrends({
      interval: interval as TrendInterval,
      startDate: startDate as string,
      endDate: endDate as string,
      type,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

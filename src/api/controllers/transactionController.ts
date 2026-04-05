import { Request, Response, NextFunction } from 'express';
import { APP_CONSTANTS, HTTP_STATUS } from '../../core/constants';
import { Errors } from '../../core/errors';
import { TransactionType } from '../../core/types';
import { Rules, Validator } from '../../core/validation';
import { AuthRequest } from '../middleware/auth';
import { transactionService } from '../../services/transactionService';

const validator = new Validator();

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.floor(parsed);
}

export const createTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, amount, category, date, notes } = req.body as {
      type?: TransactionType;
      amount?: number;
      category?: string;
      date?: string;
      notes?: string;
    };

    validator
      .reset()
      .validateField('type', type, [
        Rules.required(),
        Rules.isEnum(Object.values(TransactionType)),
      ])
      .validateField('amount', amount, [Rules.required(), Rules.isPositive()])
      .validateField('category', category, [
        Rules.required(),
        Rules.minLength(2),
        Rules.maxLength(100),
      ])
      .validateField('date', date, [Rules.required(), Rules.isISO8601()]);

    if (notes !== undefined) {
      validator.validateField('notes', notes, [Rules.maxLength(500)]);
    }

    validator.throwIfInvalid();

    if (!req.user) {
      throw Errors.unauthorized();
    }

    const created = await transactionService.createTransaction({
      userId: req.user.userId,
      type: type as TransactionType,
      amount: amount as number,
      category: category as string,
      date: date as string,
      notes,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = req.query.type as TransactionType | undefined;
    const category = req.query.category as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const minAmount = parseOptionalNumber(req.query.minAmount);
    const maxAmount = parseOptionalNumber(req.query.maxAmount);
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, APP_CONSTANTS.DEFAULT_PAGE_SIZE);

    validator
      .reset()
      .validateField('page', page, [Rules.minValue(1)])
      .validateField('pageSize', pageSize, [
        Rules.minValue(APP_CONSTANTS.MIN_PAGE_SIZE),
        Rules.maxValue(APP_CONSTANTS.MAX_PAGE_SIZE),
      ]);

    if (type !== undefined) {
      validator.validateField('type', type, [Rules.isEnum(Object.values(TransactionType))]);
    }

    if (startDate !== undefined) {
      validator.validateField('startDate', startDate, [Rules.isISO8601()]);
    }

    if (endDate !== undefined) {
      validator.validateField('endDate', endDate, [Rules.isISO8601()]);
    }

    if (minAmount !== undefined) {
      validator.validateField('minAmount', minAmount, [Rules.isPositive()]);
    }

    if (maxAmount !== undefined) {
      validator.validateField('maxAmount', maxAmount, [Rules.isPositive()]);
    }

    validator.throwIfInvalid('Invalid query parameters');

    if (
      minAmount !== undefined &&
      maxAmount !== undefined &&
      minAmount > maxAmount
    ) {
      throw Errors.validationError('Invalid amount range', [
        { field: 'minAmount', issue: 'minAmount must be less than or equal to maxAmount' },
      ]);
    }

    const result = await transactionService.listTransactions({
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page,
      pageSize,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.transactions,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);
    validator.throwIfInvalid();

    const transaction = await transactionService.getTransactionById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { type, amount, category, date, notes } = req.body as {
      type?: TransactionType;
      amount?: number;
      category?: string;
      date?: string;
      notes?: string;
    };

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);

    if (type !== undefined) {
      validator.validateField('type', type, [Rules.isEnum(Object.values(TransactionType))]);
    }

    if (amount !== undefined) {
      validator.validateField('amount', amount, [Rules.isPositive()]);
    }

    if (category !== undefined) {
      validator.validateField('category', category, [Rules.minLength(2), Rules.maxLength(100)]);
    }

    if (date !== undefined) {
      validator.validateField('date', date, [Rules.isISO8601()]);
    }

    if (notes !== undefined) {
      validator.validateField('notes', notes, [Rules.maxLength(500)]);
    }

    if (
      type === undefined &&
      amount === undefined &&
      category === undefined &&
      date === undefined &&
      notes === undefined
    ) {
      throw Errors.validationError('At least one field is required for update', [
        { field: 'body', issue: 'Provide one or more updatable fields' },
      ]);
    }

    validator.throwIfInvalid();

    const updated = await transactionService.updateTransaction(id, {
      type,
      amount,
      category,
      date,
      notes,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);
    validator.throwIfInvalid();

    await transactionService.deleteTransaction(id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

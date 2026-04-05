import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, APP_CONSTANTS } from '../../core/constants';
import { Errors } from '../../core/errors';
import { UserRole, UserStatus } from '../../core/types';
import { Rules, Validator } from '../../core/validation';
import { userService } from '../../services/userService';

const validator = new Validator();

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.floor(parsed);
}

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, status } = req.body as {
      name?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
    };

    validator
      .reset()
      .validateField('name', name, [Rules.required(), Rules.minLength(2), Rules.maxLength(100)])
      .validateField('email', email, [Rules.required(), Rules.isEmail()])
      .validateField('role', role, [
        Rules.required(),
        Rules.isEnum(Object.values(UserRole)),
      ]);

    if (status !== undefined) {
      validator.validateField('status', status, [Rules.isEnum(Object.values(UserStatus))]);
    }

    validator.throwIfInvalid();

    const created = await userService.createUser({
      name: name as string,
      email: email as string,
      role: role as UserRole,
      status: status ?? UserStatus.ACTIVE,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const status = req.query.status as UserStatus | undefined;
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, APP_CONSTANTS.DEFAULT_PAGE_SIZE);

    validator
      .reset()
      .validateField('page', page, [Rules.minValue(1)])
      .validateField('pageSize', pageSize, [
        Rules.minValue(APP_CONSTANTS.MIN_PAGE_SIZE),
        Rules.maxValue(APP_CONSTANTS.MAX_PAGE_SIZE),
      ]);

    if (role !== undefined) {
      validator.validateField('role', role, [Rules.isEnum(Object.values(UserRole))]);
    }

    if (status !== undefined) {
      validator.validateField('status', status, [Rules.isEnum(Object.values(UserStatus))]);
    }

    validator.throwIfInvalid('Invalid query parameters');

    const result = await userService.listUsers({
      role,
      status,
      page,
      pageSize,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);
    validator.throwIfInvalid();

    const user = await userService.getUserById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { name, email } = req.body as {
      name?: string;
      email?: string;
    };

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);

    if (name !== undefined) {
      validator.validateField('name', name, [Rules.minLength(2), Rules.maxLength(100)]);
    }

    if (email !== undefined) {
      validator.validateField('email', email, [Rules.isEmail()]);
    }

    if (name === undefined && email === undefined) {
      throw Errors.validationError('At least one field is required for update', [
        { field: 'body', issue: 'Provide name and/or email' },
      ]);
    }

    validator.throwIfInvalid();

    const updated = await userService.updateUserProfile(id, { name, email });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { role } = req.body as { role?: UserRole };

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)])
      .validateField('role', role, [Rules.required(), Rules.isEnum(Object.values(UserRole))]);

    validator.throwIfInvalid();

    const updated = await userService.updateUserRole(id, role as UserRole);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { status } = req.body as { status?: UserStatus };

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)])
      .validateField('status', status, [
        Rules.required(),
        Rules.isEnum(Object.values(UserStatus)),
      ]);

    validator.throwIfInvalid();

    const updated = await userService.updateUserStatus(id, status as UserStatus);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    validator
      .reset()
      .validateField('id', id, [Rules.required(), Rules.minLength(3)]);
    validator.throwIfInvalid();

    await userService.deleteUser(id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

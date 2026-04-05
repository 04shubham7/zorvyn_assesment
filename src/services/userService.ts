import { APP_CONSTANTS } from '../core/constants';
import { Errors } from '../core/errors';
import {
  PaginationMeta,
  User,
  UserRole as ApiUserRole,
  UserStatus as ApiUserStatus,
} from '../core/types';
import { userRepository } from '../repositories/userRepository';

function isNotFoundPrismaError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}

function toUser(record: {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  status: ApiUserStatus;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role as unknown as ApiUserRole,
    status: record.status as unknown as ApiUserStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function paginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface ListUsersInput {
  role?: ApiUserRole;
  status?: ApiUserStatus;
  page: number;
  pageSize: number;
}

export const userService = {
  async createUser(input: {
    name: string;
    email: string;
    role: ApiUserRole;
    status: ApiUserStatus;
  }): Promise<User> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw Errors.conflict('Email is already in use');
    }

    const created = await userRepository.create(input);
    return toUser(created);
  },

  async listUsers(input: ListUsersInput): Promise<{ users: User[]; meta: PaginationMeta }> {
    const pageSize = Math.min(
      APP_CONSTANTS.MAX_PAGE_SIZE,
      Math.max(APP_CONSTANTS.MIN_PAGE_SIZE, input.pageSize)
    );
    const page = Math.max(1, input.page);
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      userRepository.list({
        role: input.role,
        status: input.status,
        skip,
        take: pageSize,
      }),
      userRepository.count({ role: input.role, status: input.status }),
    ]);

    return {
      users: users.map(toUser),
      meta: paginationMeta(page, pageSize, total),
    };
  },

  async getUserById(id: string): Promise<User> {
    const found = await userRepository.findById(id);
    if (!found) {
      throw Errors.notFound('User not found');
    }

    return toUser(found);
  },

  async updateUserProfile(
    id: string,
    input: { name?: string; email?: string }
  ): Promise<User> {
    await this.getUserById(id);

    if (input.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw Errors.conflict('Email is already in use');
      }
    }

    try {
      const updated = await userRepository.updateProfile(id, input);
      return toUser(updated);
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw Errors.notFound('User not found');
      }
      throw error;
    }
  },

  async updateUserRole(id: string, role: ApiUserRole): Promise<User> {
    try {
      const updated = await userRepository.updateRole(id, role);
      return toUser(updated);
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw Errors.notFound('User not found');
      }
      throw error;
    }
  },

  async updateUserStatus(id: string, status: ApiUserStatus): Promise<User> {
    try {
      const updated = await userRepository.updateStatus(id, status);
      return toUser(updated);
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw Errors.notFound('User not found');
      }
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await userRepository.deleteById(id);
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw Errors.notFound('User not found');
      }
      throw error;
    }
  },
};

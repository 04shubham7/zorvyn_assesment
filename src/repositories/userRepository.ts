import { UserRole, UserStatus } from '../core/types';
import prisma from '../db/connection';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersQuery {
  role?: UserRole;
  status?: UserStatus;
  skip: number;
  take: number;
}

export const userRepository = {
  async create(data: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }): Promise<UserRecord> {
    return prisma.user.create({ data, select: userSelect }) as Promise<UserRecord>;
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { email }, select: userSelect }) as Promise<UserRecord | null>;
  },

  async findById(id: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { id }, select: userSelect }) as Promise<UserRecord | null>;
  },

  async list(query: ListUsersQuery): Promise<UserRecord[]> {
    return prisma.user.findMany({
      where: {
        role: query.role,
        status: query.status,
      },
      skip: query.skip,
      take: query.take,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    }) as Promise<UserRecord[]>;
  },

  async count(filters: { role?: UserRole; status?: UserStatus }): Promise<number> {
    return prisma.user.count({
      where: {
        role: filters.role,
        status: filters.status,
      },
    });
  },

  async updateProfile(
    id: string,
    data: { name?: string; email?: string }
  ): Promise<UserRecord> {
    return prisma.user.update({ where: { id }, data, select: userSelect }) as Promise<UserRecord>;
  },

  async updateRole(id: string, role: UserRole): Promise<UserRecord> {
    return prisma.user.update({ where: { id }, data: { role }, select: userSelect }) as Promise<UserRecord>;
  },

  async updateStatus(id: string, status: UserStatus): Promise<UserRecord> {
    return prisma.user.update({ where: { id }, data: { status }, select: userSelect }) as Promise<UserRecord>;
  },

  async deleteById(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },
};

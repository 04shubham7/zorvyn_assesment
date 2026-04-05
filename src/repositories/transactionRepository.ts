import { TransactionType } from '../core/types';
import prisma from '../db/connection';

const transactionSelect = {
  id: true,
  userId: true,
  type: true,
  amount: true,
  category: true,
  notes: true,
  date: true,
  createdAt: true,
  updatedAt: true,
};

export interface TransactionRecord {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number | { toNumber: () => number };
  category: string;
  notes: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTransactionsQuery {
  type?: TransactionType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  skip: number;
  take: number;
}

function buildWhere(query: Omit<ListTransactionsQuery, 'skip' | 'take'>) {
  return {
    type: query.type,
    category: query.category,
    date:
      query.startDate || query.endDate
        ? {
            gte: query.startDate,
            lte: query.endDate,
          }
        : undefined,
    amount:
      query.minAmount !== undefined || query.maxAmount !== undefined
        ? {
            gte: query.minAmount,
            lte: query.maxAmount,
          }
        : undefined,
  };
}

export const transactionRepository = {
  async create(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    category: string;
    notes?: string;
    date: Date;
  }): Promise<TransactionRecord> {
    return prisma.transaction.create({
      data,
      select: transactionSelect,
    }) as Promise<TransactionRecord>;
  },

  async findById(id: string): Promise<TransactionRecord | null> {
    return prisma.transaction.findUnique({
      where: { id },
      select: transactionSelect,
    }) as Promise<TransactionRecord | null>;
  },

  async list(query: ListTransactionsQuery): Promise<TransactionRecord[]> {
    return prisma.transaction.findMany({
      where: buildWhere(query),
      skip: query.skip,
      take: query.take,
      orderBy: { date: 'desc' },
      select: transactionSelect,
    }) as Promise<TransactionRecord[]>;
  },

  async count(query: Omit<ListTransactionsQuery, 'skip' | 'take'>): Promise<number> {
    return prisma.transaction.count({ where: buildWhere(query) });
  },

  async update(
    id: string,
    data: {
      type?: TransactionType;
      amount?: number;
      category?: string;
      notes?: string;
      date?: Date;
    }
  ): Promise<TransactionRecord> {
    return prisma.transaction.update({
      where: { id },
      data,
      select: transactionSelect,
    }) as Promise<TransactionRecord>;
  },

  async deleteById(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } });
  },
};

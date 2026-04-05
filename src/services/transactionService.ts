import { APP_CONSTANTS } from '../core/constants';
import { Errors } from '../core/errors';
import {
  PaginationMeta,
  Transaction,
  TransactionType as ApiTransactionType,
} from '../core/types';
import { transactionRepository } from '../repositories/transactionRepository';

function isNotFoundPrismaError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}

function toTransaction(record: {
  id: string;
  userId: string;
  type: ApiTransactionType;
  amount: number | { toNumber: () => number };
  category: string;
  notes: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}): Transaction {
  return {
    id: record.id,
    userId: record.userId,
    type: record.type,
    amount:
      typeof record.amount === 'number' ? record.amount : record.amount.toNumber(),
    category: record.category,
    notes: record.notes ?? undefined,
    date: record.date.toISOString(),
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

export interface ListTransactionsInput {
  type?: ApiTransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page: number;
  pageSize: number;
}

export const transactionService = {
  async createTransaction(input: {
    userId: string;
    type: ApiTransactionType;
    amount: number;
    category: string;
    notes?: string;
    date: string;
  }): Promise<Transaction> {
    const created = await transactionRepository.create({
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      notes: input.notes,
      date: new Date(input.date),
    });

    return toTransaction(created);
  },

  async listTransactions(
    input: ListTransactionsInput
  ): Promise<{ transactions: Transaction[]; meta: PaginationMeta }> {
    const pageSize = Math.min(
      APP_CONSTANTS.MAX_PAGE_SIZE,
      Math.max(APP_CONSTANTS.MIN_PAGE_SIZE, input.pageSize)
    );
    const page = Math.max(1, input.page);
    const skip = (page - 1) * pageSize;

    const queryFilters = {
      type: input.type,
      category: input.category,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      minAmount: input.minAmount,
      maxAmount: input.maxAmount,
    };

    const [transactions, total] = await Promise.all([
      transactionRepository.list({
        ...queryFilters,
        skip,
        take: pageSize,
      }),
      transactionRepository.count(queryFilters),
    ]);

    return {
      transactions: transactions.map(toTransaction),
      meta: paginationMeta(page, pageSize, total),
    };
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const found = await transactionRepository.findById(id);
    if (!found) {
      throw Errors.notFound('Transaction not found');
    }
    return toTransaction(found);
  },

  async updateTransaction(
    id: string,
    input: {
      type?: ApiTransactionType;
      amount?: number;
      category?: string;
      notes?: string;
      date?: string;
    }
  ): Promise<Transaction> {
    try {
      const updated = await transactionRepository.update(id, {
        type: input.type,
        amount: input.amount,
        category: input.category,
        notes: input.notes,
        date: input.date ? new Date(input.date) : undefined,
      });

      return toTransaction(updated);
    } catch (error) {
      if (
        isNotFoundPrismaError(error)
      ) {
        throw Errors.notFound('Transaction not found');
      }
      throw error;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await transactionRepository.deleteById(id);
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw Errors.notFound('Transaction not found');
      }
      throw error;
    }
  },
};

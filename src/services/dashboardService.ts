import prisma from '../db/connection';
import { APP_CONSTANTS } from '../core/constants';
import { TransactionType } from '../core/types';

type BucketInterval = 'day' | 'week' | 'month';

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

interface TrendPoint {
  periodStart: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
}

function toNumber(value: number | { toNumber: () => number }): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getBucketDate(date: Date, interval: BucketInterval): Date {
  if (interval === 'day') {
    return startOfDay(date);
  }
  if (interval === 'week') {
    return startOfWeek(date);
  }
  return startOfMonth(date);
}

function getDateWhere(filter: DateRangeFilter) {
  if (!filter.startDate && !filter.endDate) {
    return undefined;
  }

  return {
    gte: filter.startDate ? new Date(filter.startDate) : undefined,
    lte: filter.endDate ? new Date(filter.endDate) : undefined,
  };
}

export const dashboardService = {
  async getSummary(filter: DateRangeFilter & { category?: string }) {
    const where = {
      date: getDateWhere(filter),
      category: filter.category,
    };

    const [incomeAgg, expenseAgg, transactionCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: TransactionType.INCOME,
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: TransactionType.EXPENSE,
        },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalIncome = incomeAgg._sum.amount ? toNumber(incomeAgg._sum.amount as any) : 0;
    const totalExpense = expenseAgg._sum.amount ? toNumber(expenseAgg._sum.amount as any) : 0;

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount,
    };
  },

  async getCategoryTotals(filter: DateRangeFilter & { type?: TransactionType }) {
    const rows = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where: {
        type: filter.type,
        date: getDateWhere(filter),
      },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: [{ category: 'asc' }, { type: 'asc' }],
    });

    return rows.map((row: any) => ({
      category: row.category,
      type: row.type as TransactionType,
      totalAmount: row._sum.amount ? toNumber(row._sum.amount as any) : 0,
      count: row._count._all,
    }));
  },

  async getRecentActivity(filter: { limit?: number; type?: TransactionType }) {
    const limit = Math.min(
      APP_CONSTANTS.MAX_RECENT_ACTIVITY_LIMIT,
      Math.max(1, filter.limit ?? APP_CONSTANTS.DEFAULT_RECENT_ACTIVITY_LIMIT)
    );

    const rows = await prisma.transaction.findMany({
      where: {
        type: filter.type,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        category: true,
        notes: true,
        date: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      type: row.type as TransactionType,
      amount: toNumber(row.amount as any),
      category: row.category,
      notes: row.notes ?? undefined,
      date: row.date.toISOString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  async getTrends(filter: {
    interval: BucketInterval;
    startDate: string;
    endDate: string;
    type?: TransactionType;
  }): Promise<TrendPoint[]> {
    const rows = await prisma.transaction.findMany({
      where: {
        type: filter.type,
        date: {
          gte: new Date(filter.startDate),
          lte: new Date(filter.endDate),
        },
      },
      select: {
        date: true,
        type: true,
        amount: true,
      },
      orderBy: { date: 'asc' },
    });

    const buckets = new Map<string, { income: number; expense: number }>();

    for (const row of rows) {
      const bucketDate = getBucketDate(row.date, filter.interval);
      const key = bucketDate.toISOString();

      const current = buckets.get(key) ?? { income: 0, expense: 0 };
      const amount = toNumber(row.amount as any);

      if ((row.type as TransactionType) === TransactionType.INCOME) {
        current.income += amount;
      } else {
        current.expense += amount;
      }

      buckets.set(key, current);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([periodStart, totals]) => ({
        periodStart,
        incomeTotal: totals.income,
        expenseTotal: totals.expense,
        net: totals.income - totals.expense,
      }));
  },
};

import 'dotenv/config';
import prisma from '../db/connection';
import { Token } from '../core/auth';
import { TransactionType, UserRole, UserStatus } from '../core/types';

interface SeedUserInput {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

async function seedUsers() {
  const users: SeedUserInput[] = [
    {
      name: 'Admin User',
      email: 'admin@finance.local',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      name: 'Analyst User',
      email: 'analyst@finance.local',
      role: UserRole.ANALYST,
      status: UserStatus.ACTIVE,
    },
    {
      name: 'Viewer User',
      email: 'viewer@finance.local',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    },
  ];

  const seededUsers = [] as Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }>;

  for (const user of users) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        status: user.status,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    seededUsers.push({
      id: upserted.id,
      name: upserted.name,
      email: upserted.email,
      role: upserted.role as UserRole,
      status: upserted.status as UserStatus,
    });
  }

  return seededUsers;
}

async function seedTransactions(userIds: { adminId: string; analystId: string }) {
  await prisma.transaction.deleteMany({
    where: {
      userId: {
        in: [userIds.adminId, userIds.analystId],
      },
    },
  });

  const transactions = [
    {
      userId: userIds.adminId,
      type: TransactionType.INCOME,
      amount: 5200.0,
      category: 'Salary',
      notes: 'Monthly salary',
      date: daysAgo(28),
    },
    {
      userId: userIds.analystId,
      type: TransactionType.EXPENSE,
      amount: 120.0,
      category: 'Groceries',
      notes: 'Weekly groceries',
      date: daysAgo(24),
    },
    {
      userId: userIds.adminId,
      type: TransactionType.EXPENSE,
      amount: 75.5,
      category: 'Transport',
      notes: 'Fuel refill',
      date: daysAgo(20),
    },
    {
      userId: userIds.analystId,
      type: TransactionType.INCOME,
      amount: 850.0,
      category: 'Freelance',
      notes: 'Consulting payment',
      date: daysAgo(17),
    },
    {
      userId: userIds.adminId,
      type: TransactionType.EXPENSE,
      amount: 300.0,
      category: 'Rent',
      notes: 'Partial rent transfer',
      date: daysAgo(13),
    },
    {
      userId: userIds.analystId,
      type: TransactionType.EXPENSE,
      amount: 42.25,
      category: 'Utilities',
      notes: 'Internet bill',
      date: daysAgo(9),
    },
    {
      userId: userIds.adminId,
      type: TransactionType.INCOME,
      amount: 1500.0,
      category: 'Bonus',
      notes: 'Quarterly bonus',
      date: daysAgo(6),
    },
    {
      userId: userIds.analystId,
      type: TransactionType.EXPENSE,
      amount: 210.0,
      category: 'Equipment',
      notes: 'Office accessories',
      date: daysAgo(3),
    },
    {
      userId: userIds.adminId,
      type: TransactionType.EXPENSE,
      amount: 95.0,
      category: 'Dining',
      notes: 'Team dinner',
      date: daysAgo(1),
    },
    {
      userId: userIds.analystId,
      type: TransactionType.INCOME,
      amount: 420.0,
      category: 'Investment',
      notes: 'Dividend payout',
      date: daysAgo(0),
    },
  ];

  await prisma.transaction.createMany({ data: transactions });
}

function printValidationTokens(
  users: Array<{
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }>
) {
  console.log('\nSeed complete. Use these Bearer tokens for API validation:\n');

  for (const user of users) {
    const token = Token.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    console.log(`${user.role}: ${token}`);
  }

  console.log('\nSample call (PowerShell):');
  console.log('Invoke-WebRequest -Uri "http://localhost:5000/api/v1/dashboard/summary" -UseBasicParsing -Headers @{"Authorization"="Bearer <PASTE_TOKEN>"} | Select-Object -ExpandProperty Content');
}

async function main() {
  const seededUsers = await seedUsers();

  const admin = seededUsers.find((u) => u.role === UserRole.ADMIN);
  const analyst = seededUsers.find((u) => u.role === UserRole.ANALYST);

  if (!admin || !analyst) {
    throw new Error('Required seed users were not created');
  }

  await seedTransactions({
    adminId: admin.id,
    analystId: analyst.id,
  });

  printValidationTokens(seededUsers);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

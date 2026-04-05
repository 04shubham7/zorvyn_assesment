# Prisma ORM Setup & Neon DB Migration Guide

## Overview

This backend now uses **Prisma ORM** for type-safe database operations. Prisma provides:
- Type-safe database client
- Automatic migrations
- Built-in validation
- Query optimization
- Excellent DX with IDE autocomplete

## Setup Steps

### 1. Verify Environment

Your `.env` should have a Neon connection string:
```
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/database?sslmode=require
```

### 2. Create Initial Migration

Once your Neon database is accessible, run:

```bash
npm run prisma:migrate
```

When prompted, name the migration `init`:
```
✔ Enter a name for the new migration: › init
```

This will:
- Create `prisma/migrations/001_init/migration.sql`
- Apply the schema to your Neon database
- Generate the Prisma Client

### 3. Verify Schema in Neon

Check your Neon console at https://console.neon.tech to confirm tables were created:
- `User` table with fields: id, name, email, role, status, passwordHash, createdAt, updatedAt
- `Transaction` table with fields: id, userId, type, amount, category, notes, date, createdAt, updatedAt
- All indexes properly applied

### 4. Explore Database (Optional)

Use Prisma Studio to browse your data:
```bash
npm run prisma:studio
```

Opens a web UI at http://localhost:5555

## Schema Overview

The Prisma schema (`prisma/schema.prisma`) defines:

### User Model
```prisma
model User {
  id        String      @id @default(cuid())
  name      String
  email     String      @unique
  role      UserRole    // VIEWER | ANALYST | ADMIN
  status    UserStatus  // ACTIVE | INACTIVE
  transactions Transaction[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}
```

### Transaction Model
```prisma
model Transaction {
  id        String      @id @default(cuid())
  userId    String
  user      User        // Foreign key relation
  type      TransactionType  // INCOME | EXPENSE
  amount    Decimal     // 12,2 precision
  category  String
  notes     String?
  date      DateTime    // ISO date
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}
```

## Using Prisma Client in Code

### Importing Prisma
```typescript
import prisma from '@/db/connection';
```

### Query Examples

**Create user:**
```typescript
const user = await prisma.user.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    role: "ANALYST",
    status: "ACTIVE"
  }
});
```

**Find users:**
```typescript
const users = await prisma.user.findMany({
  where: { role: "ANALYST" },
  include: { transactions: true }
});
```

**Create transaction:**
```typescript
const txn = await prisma.transaction.create({
  data: {
    userId: "user-id",
    type: "INCOME",
    amount: 1500.50,
    category: "Salary",
    date: new Date("2026-04-01")
  }
});
```

**Aggregate queries:**
```typescript
const totals = await prisma.transaction.groupBy({
  by: ['type'],
  _sum: { amount: true },
  where: { userId: "user-id" }
});
```

## Key Prisma Commands

```bash
# Create/update migration and sync schema
npm run prisma:migrate

# Generate Prisma Client (auto-runs on migrate)
npx prisma generate

# Open Prisma Studio (web UI)
npm run prisma:studio

# Format schema file
npx prisma format

# Validate schema syntax
npx prisma validate
```

## Making Schema Changes

### When you modify `prisma/schema.prisma`:

1. Edit the schema file
2. Run: `npm run prisma:migrate`
3. Name the migration (e.g., `add_user_status_field`)
4. Migration is generated and applied automatically

**Example:** Adding a field
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?  // ← New field
  // ...
}
```

Then run:
```bash
npm run prisma:migrate
```

## Network/Connection Issues

If you get **"Can't reach database server"** error:

1. **Verify Neon is running:**
   - Go to https://console.neon.tech
   - Check if your project/database exists and is active

2. **Test network connectivity:**
   ```powershell
   # Windows PowerShell
   Test-NetConnection -ComputerName ep-autumn-block-an9h4k9q-pooler.c-6.us-east-1.aws.neon.tech -Port 5432
   ```

3. **Check .env:**
   - Ensure `DATABASE_URL` has correct connection string
   - No extra spaces or special characters
   - Format: `postgresql://user:pass@host/db?sslmode=require`

4. **If using VPN:**
   - Try disabling VPN temporarily
   - Check if port 5432 is blocked

## Production Deployment

In production, use:
```bash
# Apply pending migrations (don't create new ones)
npx prisma migrate deploy
```

This is safer than `migrate dev` because it:
- Applies pre-created migrations only
- Doesn't generate new ones on the fly
- Fails if migrations are missing

## Next Steps

Once Neon connection works:

1. Run migrations: `npm run prisma:migrate`
2. Implement repositories using Prisma Client
3. Update Phase 2 controllers to use Prisma
4. Add validation before Prisma calls
5. Error handling for Prisma exceptions

See `src/db/connection.ts` for Prisma Client export and usage patterns.

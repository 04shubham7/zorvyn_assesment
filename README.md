# Finance Dashboard Backend

A clean, maintainable backend for a finance dashboard with RBAC, financial records management, and aggregation APIs.

## Project Overview

This is an educational project designed to demonstrate:
- **Clean Architecture**: Clear separation of concerns (routes, controllers, services, repositories)
- **RBAC Implementation**: Role-based access control with three tiers (Viewer, Analyst, Admin)
- **API Design**: RESTful endpoints with consistent response envelopes and error handling
- **Data Modeling**: Normalized relational schema for users and transactions
- **Input Validation**: Structured validation with composable rules
- **Error Handling**: Structured error responses with codes and details

## Tech Stack

- **Runtime**: Node.js 16+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon serverless platform)
- **ORM**: Prisma (type-safe database client)
- **Authentication**: JWT (JSON Web Tokens)
- **Utilities**: bcryptjs, dotenv, uuid

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Neon Database

1. Go to [https://console.neon.tech](https://console.neon.tech) and create an account
2. Create a new project and database
3. Copy the **Connection String** from the Neon dashboard
4. It should look like: `postgresql://user:password@ep-xxxx-xxxxx.neon.tech/database?sslmode=require`

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and paste your Neon connection string:
```
DATABASE_URL=postgresql://user:password@ep-xxxx-xxxxx.neon.tech/finance_dashboard?sslmode=require
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
PORT=5000
```

### 4. Run Prisma Migrations

Once your Neon database is accessible, apply the schema:

```bash
npm run prisma:migrate
```

This will:
- Connect to your Neon database
- Create tables (users, transactions)
- Generate Prisma Client
- Create migration files in `prisma/migrations/`

When prompted, name the migration `init`.

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`.

### 6. Seed Sample Data (Users + Transactions)

Run the seed once to quickly validate dashboard outputs:

```bash
npm run seed
```

This will:
- Upsert three users (ADMIN, ANALYST, VIEWER)
- Insert sample transactions across categories and dates
- Print JWT tokens you can use to call protected endpoints immediately

### 7. Verify Setup

Check health endpoint:
```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-05T11:00:00Z"
  }
}
```

**For detailed Prisma setup and troubleshooting, see [PRISMA_SETUP.md](PRISMA_SETUP.md).**

## Project Structure

```
src/
├── api/
│   ├── controllers/       # Request handlers (business logic coordination)
│   ├── routes/            # Route definitions
│   ├── middleware/        # Auth, error handling, RBAC
│   └── services/          # Business logic (to be implemented in Phase 2)
├── core/
│   ├── types.ts           # Core type definitions
│   ├── errors.ts          # Error classes and handlers
│   ├── validation.ts      # Validation rules and utilities
│   └── auth.ts            # JWT and RBAC utilities
├── db/
│   ├── schema.ts          # SQL schema definitions
│   ├── migrate.ts         # Migration runner
│   ├── connection.ts      # Database pool
│   └── repositories/      # Data access layer (to be implemented)
├── app.ts                 # Express app factory
└── server.ts              # Entry point, starts server and runs migrations
```

## API - Phase 1 Status

Phase 1 (Foundation) is **COMPLETE**:
- ✓ Project structure
- ✓ Database schema and migrations
- ✓ Error handling module
- ✓ Input validation utilities
- ✓ JWT authentication context
- ✓ RBAC middleware
- ✓ Base app and server setup

**Phase 2 & 3 Coming Next**:
- User management endpoints (POST /users, GET /users, etc.)
- Transaction CRUD endpoints
- Dashboard aggregation APIs

See [docs/Api.md](docs/Api.md) for full endpoint specifications.

## RBAC (Role-Based Access Control)

Three user roles with hierarchical permissions:

| Role | Permissions |
|---|---|
| **Viewer** | Read-only dashboard access (summary, trends, analytics) |
| **Analyst** | Viewer + create and update financial records |
| **Admin** | Analyst + delete records + full user management |

Roles are enforced via `requireRole()` middleware on protected endpoints.

## Validation and Error Handling

### Request Validation

Use composable validation rules in controllers:

```typescript
const validator = new Validator()
  .validateField('email', req.body.email, [Rules.required(), Rules.isEmail()])
  .validateField('amount', req.body.amount, [Rules.required(), Rules.isPositive()])
  .throwIfInvalid();
```

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      { "field": "amount", "issue": "must be greater than 0" }
    ]
  }
}
```

ErrKey Scripts

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Development server with auto-reload
npm run dev

# Seed sample users and transactions
npm run seed

# Create/apply Prisma migration
npm run prisma:migrate

# Open Prisma Studio (web UI for data)
npm run prisma:studio
# Start production server
npm start

# Development server with auto-reload
npm run dev

# Run database migrations
npm run migrate

# Lint code
npm run lint

# Run tests
npm run test
```
Defined in `prisma/schema.prisma` using Prisma's SDL:

### User Table
- `id` (string, primary key, auto-generated)
- `name` (string)
- `email` (string, unique)
- `role` (enum: VIEWER, ANALYST, ADMIN)
- `status` (enum: ACTIVE, INACTIVE)
- `passwordHash` (optional string)
- `transactions` (relation to Transaction)
- `createdAt`, `updatedAt` (timestamps)

Indexes: email, role, status

### Transaction Table
- `id` (string, primary key, auto-generated)
- `userId` (foreign key → users.id, cascade delete)
- `type` (enum: INCOME, EXPENSE)
- `amount` (decimal, 12.2 precision)
- `category` (string)
- `notes` (optional string)
- `date` (ISO date)
- `createdAt`, `updatedAt` (timestamps)

Indexes: userI
- `created_at`, `updated_at` (timestamps)

Indexes: user_id, type, category, date, type+date, category+type

## Key Design Decisions

1. **JWT Authentication**: Stateless, scalable authentication without session stores.
2. **ACTIVE/INACTIVE Status**: Users can be deactivated without deletion.
3. **Hierarchical Roles**: Admin > Analyst > Viewer for simpler permission checks.
4. **Timestamps**: All records include `created_at` and `updated_at` for audit trails.
5. **Composable Validation**: Validation rules are reusable and declarative.
6. **Structured Errors**: All errors follow a standard envelope with codes and field-level details.

## Next Steps (Phase 2)

- Implement user service and repository
- Create CRUD controllers for users
- Add password hashing (bcryptjs)
- Implement transaction service and repository
- Add transaction CRUD controllers with filtering/pagination

## Next Steps (Phase 3)

- Implement dashboard service for aggregations
- Create aggregation endpoints (summary, category-totals, trends, recent-activity)
- Add query optimization and indexes

## Notes and Assumptions

- Database auto-generates UUIDs using PostgreSQL's `gen_random_uuid()`.
- JWT tokens expire after 7 days (configurable via `JWT_EXPIRY`).
- User status affects access: inactive users cannot access protected APIs.
- Transaction amounts are required to be positive (DECIMAL CHECK).
- All dates are stored in UTC.

## License

ISC

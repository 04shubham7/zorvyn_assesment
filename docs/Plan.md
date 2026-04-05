# Finance Dashboard Backend - Implementation Plan

## 1) Assignment Objective
Design and implement a clean backend for a finance dashboard that emphasizes:
- clear API design,
- robust data modeling,
- correct business logic,
- maintainable structure and separation of concerns.

This is intentionally not production-scale infrastructure work. The quality target is correctness, readability, and architecture discipline.

## 2) Functional Scope
- RBAC with 3 roles:
  - Viewer: read-only dashboard analytics (no transaction management).
  - Analyst: Viewer + create/read/update financial records (no user/delete).
  - Admin: Analyst + delete records + full user/role/status management.
- User and Role Management:
  - Create, list, update user details.
  - Assign or change user roles.
  - Set user status (ACTIVE/INACTIVE).
  - Delete users.
- Financial Transactions:
  - Full CRUD (create, read, update, delete).
  - Type: income/expense.
  - Filtering by date, category, amount, and type.
  - Pagination and sorting.
- Dashboard Aggregations:
  - Summary KPIs (total income, total expense, net balance, transaction count).
  - Category-wise totals grouped by type.
  - Recent activity feed (latest transactions).
  - Time trends (daily/weekly/monthly bucketing).
- Input validation and structured error handling.

## 3) Non-Functional Priorities
- Separation of concerns:
  - Router/controller layer (HTTP concerns)
  - Service layer (business logic)
  - Repository/data-access layer (DB queries)
  - Validation and error modules (cross-cutting)
- Predictable API conventions:
  - consistent response shape,
  - consistent status codes,
  - explicit query/filter contracts.
- Testability:
  - pure business logic in services,
  - repository interfaces that can be mocked.

## 4) Proposed Domain Model
### User
- id (UUID)
- name
- email (unique)
- role (enum: VIEWER, ANALYST, ADMIN)
- status (enum: ACTIVE, INACTIVE; default ACTIVE)
- created_at, updated_at

### Transaction
- id (UUID)
- user_id (FK -> users.id)
- type (enum: INCOME, EXPENSE)
- amount (decimal > 0)
- category (string or FK to categories table)
- notes (optional string)
- date (ISO date)
- created_at, updated_at

### Optional: Category
- id (UUID)
- name (unique)
- kind (enum: INCOME, EXPENSE, BOTH)

## 5) Suggested Folder Structure
- src/
  - api/
    - routes/
    - controllers/
    - middleware/
  - core/
    - errors/
    - validation/
    - constants/
  - modules/
    - auth/
    - users/
    - transactions/
    - dashboard/
  - db/
    - schema/
    - migrations/
    - repositories/
  - app.(ts|js)
  - server.(ts|js)

## 6) RBAC Rules Matrix
- Viewer (read-only dashboard):
  - GET /dashboard/summary
  - GET /dashboard/category-totals
  - GET /dashboard/recent-activity
  - GET /dashboard/trends
- Analyst (Viewer + financial operations):
  - all Viewer permissions
  - POST /transactions
  - GET /transactions
  - GET /transactions/:id
  - PATCH /transactions/:id
- Admin (full system access):
  - all Analyst permissions
  - DELETE /transactions/:id
  - POST /users
  - GET /users
  - GET /users/:id
  - PATCH /users/:id
  - PATCH /users/:id/role
  - PATCH /users/:id/status
  - DELETE /users/:id

## 7) Response and Error Standard
### Success (example)
- {
  "success": true,
  "data": {...},
  "meta": {...}
}

### Error (example)
- {
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [{"field":"amount","issue":"must be > 0"}]
  }
}

## 8) Validation Strategy
- Validate request params, query, and body at boundary (controller/middleware).
- Schema checks:
  - amount must be positive,
  - type must be INCOME/EXPENSE,
  - transaction_date valid ISO date,
  - pagination bounds,
  - trend interval in allowed set.
- Fail fast with 400 + structured errors.

## 9) Aggregation Logic Requirements
- Net balance = sum(income) - sum(expense).
- Category totals grouped by category and type.
- Trends grouped by selected interval (day/week/month) and date range.
- All aggregations must honor applied filters (date range, category, type, etc.).

## 10) Delivery Phases
### Phase 1 - Foundation (Core Infrastructure)
**Deliverables:**
- Project structure (folder layout, package management).
- Database initialization (schema for users, transactions).
- Migrations or schema setup scripts.
- Error handling module (structured error types and responses).
- Input validation utilities (schemas, composable validators).
- JWT/token authentication context.
- RBAC middleware (role-based access control).
- Base controller/service layer skeleton.
**Outcome:** Complete backend skeleton with auth and middleware in place, no business logic yet.

### Phase 2 - Transactions & User Management Modules
**Deliverables:**
- User management (POST, GET, GET/:id, PATCH, PATCH/:id/role, PATCH/:id/status, DELETE).
- User service layer (validation, role assignment, status management).
- Transaction CRUD endpoints (POST, GET, GET/:id, PATCH, DELETE).
- Filtering (type, category, date range, amount range).
- Sorting and pagination.
- Transaction + User service tests.
**Outcome:** Full CRUD + management endpoints working with correct RBAC enforcement.

### Phase 3 - Dashboard Module
**Deliverables:**
- GET /dashboard/summary (KPIs: income, expense, net, count).
- GET /dashboard/category-totals (grouped by category and type).
- GET /dashboard/recent-activity (latest transactions feed).
- GET /dashboard/trends (bucketed by day/week/month with income/expense/net).
- Query optimization for grouped reads (indexes, efficient aggregations).
**Outcome:** Complete dashboard analytics with correct aggregation logic and filter support.

### Phase 4 - Hardening & Documentation
**Deliverables:**
- Edge case validation (inactive users, invalid date ranges, etc.).
- Unified error mapping (consistent error codes and messages across all endpoints).
- Comprehensive README (setup, API overview, assumptions, tradeoffs).
- Optional: unit/integration tests for critical paths.
- Optional: Postman collection or OpenAPI spec.
**Outcome:** Production-ready documentation, edge case handling, and test coverage.

## 11) Acceptance Checklist
- ✓ RBAC works for all role tiers (Viewer, Analyst, Admin).
- ✓ User management endpoints are functional (create, list, update role/status, delete).
- ✓ Transaction CRUD is complete and permission-gated.
- ✓ Filters are correct and composable (date, category, type, amount, status).
- ✓ Aggregation outputs are accurate (net balance, category totals, trends, recent activity).
- ✓ Validation rejects malformed payloads with structured error details.
- ✓ Errors are consistent and structured (success/error envelopes, codes, messages).
- ✓ Codebase is modular with clear boundaries (routes, controllers, services, repositories).
- ✓ Inactive users cannot access protected endpoints.
- ✓ Documentation is clear (README, API contract, architecture overview).

## 12) Tech Stack Recommendation (Phase 1 Bootstrap)
For this assignment, recommend one of:
- **Node.js + Express + TypeScript** (recommended for rapid development, strong typing)
- **Node.js + Fastify + TypeScript** (performance-oriented alternative)
- **Python + Flask/FastAPI** (simpler syntax, strong validation frameworks)

Database: SQLite (easy, no setup) or PostgreSQL (recommended for production-like feel).

Once tech stack is confirmed, Phase 1 bootstrap will generate all foundation files.

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
  - Viewer: read-only access to transactions and dashboard summaries.
  - Analyst: read + create/update transactions; no user/permission management.
  - Admin: full access including delete and management capabilities.
- Financial Transactions:
  - Full CRUD.
  - Type: income/expense.
  - Filtering and pagination.
- Dashboard Aggregations:
  - Net balance.
  - Category totals.
  - Time trends (daily/weekly/monthly).
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
- created_at, updated_at

### Transaction
- id (UUID)
- user_id (FK -> users.id)
- type (enum: INCOME, EXPENSE)
- amount (decimal > 0)
- category (string or FK to categories table)
- description (optional string)
- transaction_date (date)
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
- Viewer:
  - GET /transactions
  - GET /transactions/:id
  - GET /dashboard/summary
  - GET /dashboard/category-totals
  - GET /dashboard/trends
- Analyst:
  - all Viewer permissions
  - POST /transactions
  - PATCH /transactions/:id
- Admin:
  - all Analyst permissions
  - DELETE /transactions/:id
  - user/role administration endpoints (if included)

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
### Phase 1 - Foundation
- Bootstrap project structure.
- DB schema + migrations.
- Shared error and validation utilities.
- Authentication context and role middleware.

### Phase 2 - Transactions Module
- CRUD endpoints.
- Filtering, sorting, pagination.
- Transaction service + repository tests.

### Phase 3 - Dashboard Module
- Summary endpoint.
- Category totals endpoint.
- Trends endpoint.
- Query optimization for grouped reads.

### Phase 4 - Hardening
- Edge case validation.
- Unified error mapping.
- API docs and flow diagrams.

## 11) Acceptance Checklist
- RBAC works for all role tiers.
- CRUD is complete and permission-gated.
- Filters are correct and composable.
- Aggregation outputs are accurate.
- Validation rejects malformed payloads.
- Errors are consistent and structured.
- Codebase is modular with clear boundaries.

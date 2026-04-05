# Finance Dashboard Backend - API Design

## 1) API Conventions
- Base URL: /api/v1
- Auth: Bearer JWT (contains user id + role claim)
- Content-Type: application/json
- Time format: ISO-8601
- Monetary values: decimal with fixed precision (e.g., 2 decimals)

## 2) RBAC Overview
- VIEWER: read-only on transactions + dashboard analytics
- ANALYST: VIEWER + create/update transactions
- ADMIN: ANALYST + delete transactions + admin-only endpoints

## 3) Endpoints

### 3.1 Transactions

#### POST /transactions
Create transaction.
- Roles: ANALYST, ADMIN
- Body:
  - type: INCOME | EXPENSE
  - amount: number (>0)
  - category: string
  - description?: string
  - transactionDate: string (ISO date)
- 201 response:
  - data: created transaction

#### GET /transactions
List transactions with filtering.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - type?: INCOME | EXPENSE
  - category?: string
  - minAmount?: number
  - maxAmount?: number
  - startDate?: ISO date
  - endDate?: ISO date
  - sortBy?: transactionDate | amount | createdAt
  - sortOrder?: asc | desc
  - page?: number (default 1)
  - pageSize?: number (default 20, max 100)
- 200 response:
  - data: transaction[]
  - meta: pagination + applied filters

#### GET /transactions/:id
Get transaction by id.
- Roles: VIEWER, ANALYST, ADMIN
- Path params:
  - id: UUID
- 200 response:
  - data: transaction

#### PATCH /transactions/:id
Partial update transaction.
- Roles: ANALYST, ADMIN
- Path params:
  - id: UUID
- Body (any subset):
  - type, amount, category, description, transactionDate
- 200 response:
  - data: updated transaction

#### DELETE /transactions/:id
Delete transaction.
- Roles: ADMIN
- Path params:
  - id: UUID
- 204 response:
  - no body

### 3.2 Dashboard Aggregations

#### GET /dashboard/summary
Overall dashboard KPIs.
- Roles: VIEWER, ANALYST, ADMIN
- Query params (optional filters):
  - startDate, endDate, category
- 200 response:
  - data:
    - totalIncome
    - totalExpense
    - netBalance
    - transactionCount

#### GET /dashboard/category-totals
Grouped totals by category.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - type?: INCOME | EXPENSE
  - startDate?: ISO date
  - endDate?: ISO date
- 200 response:
  - data: [{ category, type, totalAmount, count }]

#### GET /dashboard/trends
Time-series trend for charting.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - interval: day | week | month
  - startDate: ISO date
  - endDate: ISO date
  - type?: INCOME | EXPENSE
- 200 response:
  - data: [{ periodStart, incomeTotal, expenseTotal, net }]

## 4) Example Response Schemas

### Success
{
  "success": true,
  "data": {},
  "meta": {}
}

### Validation Error (400)
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

### Unauthorized (401)
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}

### Forbidden (403)
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient role permission"
  }
}

### Not Found (404)
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Transaction not found"
  }
}

### Internal Error (500)
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error"
  }
}

## 5) Validation Rules (Concise)
- amount > 0
- transactionDate is valid date
- startDate <= endDate
- minAmount <= maxAmount
- page >= 1
- pageSize in [1, 100]
- interval in {day, week, month}

## 6) Suggested Indexes
- transactions(transaction_date)
- transactions(type)
- transactions(category)
- transactions(amount)
- composite for common filters, e.g. (type, transaction_date)

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

## 3) Route Availability Summary

Availability meaning used below:
- Available: implemented and callable in the running backend.
- Planned: defined in design docs but not yet implemented in code.

Current status for this assignment docs: all routes are planned at the design stage.

| Method | Route | Purpose | Allowed Roles | Availability |
|---|---|---|---|---|
| POST | /transactions | Create transaction | ANALYST, ADMIN | Planned |
| GET | /transactions | List transactions with filters | VIEWER, ANALYST, ADMIN | Planned |
| GET | /transactions/:id | Get single transaction | VIEWER, ANALYST, ADMIN | Planned |
| PATCH | /transactions/:id | Update transaction (partial) | ANALYST, ADMIN | Planned |
| DELETE | /transactions/:id | Delete transaction | ADMIN | Planned |
| GET | /dashboard/summary | Summary KPIs | VIEWER, ANALYST, ADMIN | Planned |
| GET | /dashboard/category-totals | Totals grouped by category | VIEWER, ANALYST, ADMIN | Planned |
| GET | /dashboard/trends | Time-series trend data | VIEWER, ANALYST, ADMIN | Planned |

## 4) Detailed API Contracts

Common request headers for all endpoints:
- Authorization: Bearer <JWT>
- Content-Type: application/json (for POST/PATCH)

Common success envelope:
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Common error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

### 4.1 Transactions

#### POST /transactions
Create transaction.
- Roles: ANALYST, ADMIN
- Request body:
  - type: INCOME | EXPENSE
  - amount: number (>0)
  - category: string
  - description?: string
  - transactionDate: string (ISO date)
- Request example:
```json
{
  "type": "EXPENSE",
  "amount": 1250.50,
  "category": "Rent",
  "description": "April rent",
  "transactionDate": "2026-04-01"
}
```
- Success response (201):
```json
{
  "success": true,
  "data": {
    "id": "2f4f3b5d-702d-4e8d-9d23-0ab8bd8ea10f",
    "userId": "73027adf-c49f-45f5-8f95-a8f49cc8a409",
    "type": "EXPENSE",
    "amount": 1250.50,
    "category": "Rent",
    "description": "April rent",
    "transactionDate": "2026-04-01",
    "createdAt": "2026-04-05T10:12:33Z",
    "updatedAt": "2026-04-05T10:12:33Z"
  }
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 403 FORBIDDEN
  - 500 INTERNAL_ERROR

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
- Request example:
  - GET /api/v1/transactions?type=EXPENSE&startDate=2026-04-01&endDate=2026-04-30&page=1&pageSize=20
- Success response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "2f4f3b5d-702d-4e8d-9d23-0ab8bd8ea10f",
      "type": "EXPENSE",
      "amount": 1250.50,
      "category": "Rent",
      "description": "April rent",
      "transactionDate": "2026-04-01"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1,
    "filters": {
      "type": "EXPENSE",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30"
    }
  }
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 500 INTERNAL_ERROR

#### GET /transactions/:id
Get transaction by id.
- Roles: VIEWER, ANALYST, ADMIN
- Path params:
  - id: UUID
- Success response (200):
```json
{
  "success": true,
  "data": {
    "id": "2f4f3b5d-702d-4e8d-9d23-0ab8bd8ea10f",
    "type": "EXPENSE",
    "amount": 1250.50,
    "category": "Rent",
    "description": "April rent",
    "transactionDate": "2026-04-01"
  }
}
```
- Error responses:
  - 401 UNAUTHORIZED
  - 404 NOT_FOUND
  - 500 INTERNAL_ERROR

#### PATCH /transactions/:id
Partial update transaction.
- Roles: ANALYST, ADMIN
- Path params:
  - id: UUID
- Request body (any subset):
  - type, amount, category, description, transactionDate
- Request example:
```json
{
  "amount": 1300,
  "description": "Rent adjusted"
}
```
- Success response (200):
```json
{
  "success": true,
  "data": {
    "id": "2f4f3b5d-702d-4e8d-9d23-0ab8bd8ea10f",
    "type": "EXPENSE",
    "amount": 1300,
    "category": "Rent",
    "description": "Rent adjusted",
    "transactionDate": "2026-04-01",
    "updatedAt": "2026-04-05T10:55:02Z"
  }
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 403 FORBIDDEN
  - 404 NOT_FOUND
  - 500 INTERNAL_ERROR

#### DELETE /transactions/:id
Delete transaction.
- Roles: ADMIN
- Path params:
  - id: UUID
- Success response (204):
  - No response body.
- Error responses:
  - 401 UNAUTHORIZED
  - 403 FORBIDDEN
  - 404 NOT_FOUND
  - 500 INTERNAL_ERROR

### 4.2 Dashboard Aggregations

#### GET /dashboard/summary
Overall dashboard KPIs.
- Roles: VIEWER, ANALYST, ADMIN
- Query params (optional filters):
  - startDate, endDate, category
- Success response (200):
```json
{
  "success": true,
  "data": {
    "totalIncome": 12000,
    "totalExpense": 5500.5,
    "netBalance": 6499.5,
    "transactionCount": 43
  },
  "meta": {
    "filters": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "category": null
    }
  }
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 500 INTERNAL_ERROR

#### GET /dashboard/category-totals
Grouped totals by category.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - type?: INCOME | EXPENSE
  - startDate?: ISO date
  - endDate?: ISO date
- Success response (200):
```json
{
  "success": true,
  "data": [
    {
      "category": "Salary",
      "type": "INCOME",
      "totalAmount": 8000,
      "count": 2
    },
    {
      "category": "Rent",
      "type": "EXPENSE",
      "totalAmount": 2500,
      "count": 2
    }
  ]
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 500 INTERNAL_ERROR

#### GET /dashboard/trends
Time-series trend for charting.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - interval: day | week | month
  - startDate: ISO date
  - endDate: ISO date
  - type?: INCOME | EXPENSE
- Success response (200):
```json
{
  "success": true,
  "data": [
    {
      "periodStart": "2026-04-01",
      "incomeTotal": 3000,
      "expenseTotal": 1200,
      "net": 1800
    },
    {
      "periodStart": "2026-04-02",
      "incomeTotal": 0,
      "expenseTotal": 300,
      "net": -300
    }
  ],
  "meta": {
    "interval": "day"
  }
}
```
- Error responses:
  - 400 VALIDATION_ERROR
  - 401 UNAUTHORIZED
  - 500 INTERNAL_ERROR

## 5) Example Error Schemas

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

## 6) Validation Rules (Concise)
- amount > 0
- transactionDate is valid date
- startDate <= endDate
- minAmount <= maxAmount
- page >= 1
- pageSize in [1, 100]
- interval in {day, week, month}

## 7) Suggested Indexes
- transactions(transaction_date)
- transactions(type)
- transactions(category)
- transactions(amount)
- composite for common filters, e.g. (type, transaction_date)

## 8) Final Consolidated Route Summary

| Method | Route | Roles | Request (Req) | Success Response | Error Responses | Availability |
|---|---|---|---|---|---|---|
| POST | /transactions | ANALYST, ADMIN | Body: type, amount, category, description?, transactionDate | 201 Created + transaction object | 400, 401, 403, 500 | Planned |
| GET | /transactions | VIEWER, ANALYST, ADMIN | Query: type?, category?, minAmount?, maxAmount?, startDate?, endDate?, sortBy?, sortOrder?, page?, pageSize? | 200 OK + transactions[] + pagination meta | 400, 401, 500 | Planned |
| GET | /transactions/:id | VIEWER, ANALYST, ADMIN | Path: id (UUID) | 200 OK + transaction object | 401, 404, 500 | Planned |
| PATCH | /transactions/:id | ANALYST, ADMIN | Path: id (UUID), Body(any): type/amount/category/description/transactionDate | 200 OK + updated transaction object | 400, 401, 403, 404, 500 | Planned |
| DELETE | /transactions/:id | ADMIN | Path: id (UUID) | 204 No Content | 401, 403, 404, 500 | Planned |
| GET | /dashboard/summary | VIEWER, ANALYST, ADMIN | Query: startDate?, endDate?, category? | 200 OK + totalIncome/totalExpense/netBalance/transactionCount | 400, 401, 500 | Planned |
| GET | /dashboard/category-totals | VIEWER, ANALYST, ADMIN | Query: type?, startDate?, endDate? | 200 OK + [{category, type, totalAmount, count}] | 400, 401, 500 | Planned |
| GET | /dashboard/trends | VIEWER, ANALYST, ADMIN | Query: interval, startDate, endDate, type? | 200 OK + time-series rows [{periodStart, incomeTotal, expenseTotal, net}] | 400, 401, 500 | Planned |

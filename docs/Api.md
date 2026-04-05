# Finance Dashboard Backend - API Design

## 1) API Conventions
- Base URL: /api/v1
- Auth: Bearer JWT (contains user id + role claim)
- Content-Type: application/json
- Time format: ISO-8601
- Monetary values: decimal with fixed precision (e.g., 2 decimals)

## 2) RBAC Overview
- VIEWER: read-only dashboard access only
- ANALYST: VIEWER + create/read/update financial records
- ADMIN: ANALYST + delete records + full user/role/status management

## 3) Route Availability Summary

Availability meaning used below:
- Available: implemented and callable in the running backend.
- Planned: defined in design docs but not yet implemented in code.

Current status for this assignment docs: Phase 2 and Phase 3 routes are available in the current backend.

Status legend:
- <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> = implemented and callable
- <span style="color:#d97706;font-weight:700;">&#9679; Planned</span> = defined in docs, pending implementation

| Method | Route | Purpose | Allowed Roles | Availability |
|:--:|---|---|---|:--:|
| POST | /users | Create user | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /users | List users | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /users/:id | Get user details | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id | Update user profile fields | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id/role | Assign or change role | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id/status | Set active or inactive status | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| DELETE | /users/:id | Delete user | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| POST | /transactions | Create transaction | ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /transactions | List transactions with filters | ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /transactions/:id | Get single transaction | ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /transactions/:id | Update transaction (partial) | ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| DELETE | /transactions/:id | Delete transaction | ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/summary | Summary KPIs | VIEWER, ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/category-totals | Totals grouped by category | VIEWER, ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/recent-activity | Latest financial activity feed | VIEWER, ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/trends | Time-series trend data | VIEWER, ANALYST, ADMIN | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |

## 4) Detailed API Contracts

Common request headers for protected endpoints:
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

### 4.1 User and Role Management

#### POST /users
Create user.
- Roles: ADMIN
- Request body:
  - name: string
  - email: string (unique, valid email)
  - role: VIEWER | ANALYST | ADMIN
  - status?: ACTIVE | INACTIVE (default ACTIVE)
- Success response (201): created user object
- Error responses: 400, 401, 403, 409, 500

#### GET /users
List users.
- Roles: ADMIN
- Query params:
  - role?: VIEWER | ANALYST | ADMIN
  - status?: ACTIVE | INACTIVE
  - page?: number (default 1)
  - pageSize?: number (default 20, max 100)
- Success response (200): users[] + pagination meta
- Error responses: 400, 401, 403, 500

#### GET /users/:id
Get user details.
- Roles: ADMIN
- Path params:
  - id: UUID
- Success response (200): user object
- Error responses: 401, 403, 404, 500

#### PATCH /users/:id
Update user profile fields.
- Roles: ADMIN
- Path params:
  - id: UUID
- Request body (any subset):
  - name, email
- Success response (200): updated user object
- Error responses: 400, 401, 403, 404, 409, 500

#### PATCH /users/:id/role
Assign or change user role.
- Roles: ADMIN
- Path params:
  - id: UUID
- Request body:
  - role: VIEWER | ANALYST | ADMIN
- Success response (200): role update result
- Error responses: 400, 401, 403, 404, 500

#### PATCH /users/:id/status
Set user status.
- Roles: ADMIN
- Path params:
  - id: UUID
- Request body:
  - status: ACTIVE | INACTIVE
- Success response (200): status update result
- Error responses: 400, 401, 403, 404, 500

#### DELETE /users/:id
Delete user (or soft-delete by policy).
- Roles: ADMIN
- Path params:
  - id: UUID
- Success response (204): no body
- Error responses: 401, 403, 404, 500

### 4.2 Financial Records (Transactions)

#### POST /transactions
Create transaction.
- Roles: ANALYST, ADMIN
- Request body:
  - type: INCOME | EXPENSE
  - amount: number (>0)
  - category: string
  - date: string (ISO date)
  - notes?: string
- Success response (201): created transaction object
- Error responses: 400, 401, 403, 500

#### GET /transactions
List transactions with filtering.
- Roles: ANALYST, ADMIN
- Query params:
  - type?: INCOME | EXPENSE
  - category?: string
  - startDate?: ISO date
  - endDate?: ISO date
  - minAmount?: number
  - maxAmount?: number
  - page?: number
  - pageSize?: number
- Success response (200): transactions[] + pagination meta
- Error responses: 400, 401, 500

#### GET /transactions/:id
Get transaction by id.
- Roles: ANALYST, ADMIN
- Path params:
  - id: UUID
- Success response (200): transaction object
- Error responses: 401, 404, 500

#### PATCH /transactions/:id
Partial update transaction.
- Roles: ANALYST, ADMIN
- Path params:
  - id: UUID
- Request body (any subset):
  - type, amount, category, date, notes
- Success response (200): updated transaction object
- Error responses: 400, 401, 403, 404, 500

#### DELETE /transactions/:id
Delete transaction.
- Roles: ADMIN
- Path params:
  - id: UUID
- Success response (204): no body
- Error responses: 401, 403, 404, 500

### 4.3 Dashboard Summary APIs

#### GET /dashboard/summary
Overall KPIs.
- Roles: VIEWER, ANALYST, ADMIN
- Query params: startDate?, endDate?, category?
- Success response (200): totalIncome, totalExpense, netBalance, transactionCount
- Error responses: 400, 401, 500

#### GET /dashboard/category-totals
Category-wise totals.
- Roles: VIEWER, ANALYST, ADMIN
- Query params: type?, startDate?, endDate?
- Success response (200): [{ category, type, totalAmount, count }]
- Error responses: 400, 401, 500

#### GET /dashboard/recent-activity
Recent financial activity feed.
- Roles: VIEWER, ANALYST, ADMIN
- Query params: limit?, type?
- Success response (200): latest transactions sorted by createdAt desc
- Error responses: 400, 401, 500

#### GET /dashboard/trends
Monthly, weekly, or daily trends.
- Roles: VIEWER, ANALYST, ADMIN
- Query params:
  - interval: day | week | month
  - startDate: ISO date
  - endDate: ISO date
  - type?: INCOME | EXPENSE
- Success response (200): [{ periodStart, incomeTotal, expenseTotal, net }]
- Error responses: 400, 401, 500

## 5) Example Error Schemas

### Validation Error (400)
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

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient role permission"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Requested resource not found"
  }
}
```

### Internal Error (500)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error"
  }
}
```

## 6) Validation and Reliability Rules
- amount > 0
- date is valid ISO date
- startDate <= endDate
- minAmount <= maxAmount
- page >= 1
- pageSize in [1, 100]
- interval in {day, week, month}
- role in {VIEWER, ANALYST, ADMIN}
- status in {ACTIVE, INACTIVE}
- inactive users cannot access protected APIs

## 7) Persistence Note
- Suggested for assignment: SQLite for simplicity (or PostgreSQL if preferred).
- If mock storage is used, it must be explicitly documented in README.

## 8) Final Consolidated Route Summary

| Method | Route | Roles | Request (Req) | Success Response | Error Responses | Availability |
|:--:|---|---|---|---|---|:--:|
| POST | /users | ADMIN | Body: name, email, role, status? | 201 Created + user object | 400, 401, 403, 409, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /users | ADMIN | Query: role?, status?, page?, pageSize? | 200 OK + users[] + pagination meta | 400, 401, 403, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /users/:id | ADMIN | Path: id | 200 OK + user object | 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id | ADMIN | Path: id, Body(any): name/email | 200 OK + updated user object | 400, 401, 403, 404, 409, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id/role | ADMIN | Path: id, Body: role | 200 OK + role update result | 400, 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /users/:id/status | ADMIN | Path: id, Body: status | 200 OK + status update result | 400, 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| DELETE | /users/:id | ADMIN | Path: id | 204 No Content | 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| POST | /transactions | ANALYST, ADMIN | Body: type, amount, category, date, notes? | 201 Created + transaction object | 400, 401, 403, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /transactions | ANALYST, ADMIN | Query: type?, category?, date range, amount range, page?, pageSize? | 200 OK + transactions[] + pagination meta | 400, 401, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /transactions/:id | ANALYST, ADMIN | Path: id | 200 OK + transaction object | 401, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| PATCH | /transactions/:id | ANALYST, ADMIN | Path: id, Body(any): type/amount/category/date/notes | 200 OK + updated transaction object | 400, 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| DELETE | /transactions/:id | ADMIN | Path: id | 204 No Content | 401, 403, 404, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/summary | VIEWER, ANALYST, ADMIN | Query: startDate?, endDate?, category? | 200 OK + income/expense/net/count | 400, 401, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/category-totals | VIEWER, ANALYST, ADMIN | Query: type?, startDate?, endDate? | 200 OK + grouped category totals | 400, 401, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/recent-activity | VIEWER, ANALYST, ADMIN | Query: limit?, type? | 200 OK + recent transactions | 400, 401, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |
| GET | /dashboard/trends | VIEWER, ANALYST, ADMIN | Query: interval, startDate, endDate, type? | 200 OK + trend buckets | 400, 401, 500 | <span style="color:#16a34a;font-weight:700;">&#10003; Available</span> |

# Finance Dashboard Backend - Flows and Data Diagrams

## 1) High-Level Request Flow
```mermaid
flowchart LR
    Client[Client App] --> Router[API Router]
    Router --> Auth[Auth Middleware]
    Auth --> RBAC[RBAC Middleware]
    RBAC --> Controller[Controller]
    Controller --> Validator[Input Validator]
    Validator --> Service[Service Layer]
    Service --> Repo[Repository Layer]
    Repo --> DB[(Database)]
    DB --> Repo
    Repo --> Service
    Service --> Controller
    Controller --> Response[HTTP JSON Response]
```

## 2) RBAC Decision Flow
```mermaid
flowchart TD
    A[Incoming Request] --> B[Extract JWT]
    B --> C{Token valid?}
    C -- No --> X[401 Unauthorized]
    C -- Yes --> D[Resolve user role]
    D --> E{Role allowed for endpoint?}
    E -- No --> Y[403 Forbidden]
    E -- Yes --> F[Proceed to Controller]
```

## 3) Transaction Create/Update Flow
```mermaid
sequenceDiagram
    participant U as User
    participant API as API Layer
    participant V as Validator
    participant S as Transaction Service
    participant R as Transaction Repository
    participant DB as Database

    U->>API: POST/PATCH /transactions
    API->>V: Validate body + params
    V-->>API: Valid
    API->>S: Execute use-case
    S->>R: Persist transaction
    R->>DB: INSERT/UPDATE
    DB-->>R: Result row
    R-->>S: Transaction entity
    S-->>API: Domain result
    API-->>U: 200/201 success response
```

## 4) Dashboard Summary Aggregation Flow
```mermaid
flowchart TD
    A[GET /dashboard/summary] --> B[Validate query filters]
    B --> C[Build aggregation criteria]
    C --> D[Aggregate income sum]
    C --> E[Aggregate expense sum]
    D --> F[Compute net balance]
    E --> F
    F --> G[Compose response DTO]
    G --> H[Return 200 JSON]
```

## 5) Trends Data Flow (Day/Week/Month)
```mermaid
flowchart LR
    Q[Query Params: startDate, endDate, interval, type] --> V[Validate interval/date range]
    V --> B[Build SQL GROUP BY bucket]
    B --> D[(Transactions Table)]
    D --> A[Aggregated Rows by Time Bucket]
    A --> M[Map rows to chart-friendly points]
    M --> R[JSON response for dashboard chart]
```

## 6) Error Handling Flow
```mermaid
flowchart TD
    A[Request] --> B{Validation error?}
    B -- Yes --> V[Return 400 VALIDATION_ERROR]
    B -- No --> C{Auth error?}
    C -- Yes --> U[Return 401 UNAUTHORIZED]
    C -- No --> D{Permission error?}
    D -- Yes --> F[Return 403 FORBIDDEN]
    D -- No --> E{Resource missing?}
    E -- Yes --> N[Return 404 NOT_FOUND]
    E -- No --> G[Execute business logic]
    G --> H{Unhandled exception?}
    H -- Yes --> I[Return 500 INTERNAL_ERROR]
    H -- No --> J[Return 2xx Success]
```

## 7) Data Model ER Diagram (Logical)
```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : creates

    USERS {
      uuid id PK
      string name
      string email
      string role
      datetime created_at
      datetime updated_at
    }

    TRANSACTIONS {
      uuid id PK
      uuid user_id FK
      string type
      decimal amount
      string category
      string description
      date transaction_date
      datetime created_at
      datetime updated_at
    }
```

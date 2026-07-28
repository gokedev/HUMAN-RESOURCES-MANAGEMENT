# HR Management SaaS System

A full-stack multi-tenant HR management platform that allows companies to register, invite employees, and manage their workforce from a single dashboard.

## Features

- **Company Registration & Multi-Tenancy** — Each company has its own isolated workspace
- **JWT Authentication** — Secure login with access + refresh token rotation
- **Role-Based Access Control** — Admin and Employee roles with route-level permissions
- **Employee Management** — Create, view, and manage employee profiles
- **Employee Invitations** — Email-based invite flow with token expiration
- **Department Management** — Create and organize departments within a company
- **Attendance Tracking** — Daily check-in / check-out with status tracking
- **Leave Requests** — Submit, review, and approve/reject leave requests
- **Password Reset** — Secure forgot/reset password flow via email
- **Profile & Settings** — Employee self-service for profile and preferences
- **Dark Mode** — Theme toggle support

## Tech Stack

### Backend (`hr-saas/`)

| Technology | Purpose |
|---|---|
| Java 20 | Runtime |
| Spring Boot 3.3 | Framework |
| Spring Security | Authentication & authorization |
| Spring Data JPA | Database access |
| PostgreSQL | Database |
| Flyway | Database migrations |
| Docker | Containerization |

### Frontend (`Frontend/`)

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| TypeScript | Type safety |
| Vite 7 | Build tool |
| React Router 7 | Client-side routing |
| TanStack Query 5 | Server state management |
| React Hook Form 7 | Form handling |
| Zod 4 | Schema validation |
| Bootstrap 5 | UI components |

## Project Structure

```
Hr-management-system/
├── hr-saas/                        # Spring Boot backend
│   └── src/main/java/com/hrsaas/
│       ├── config/                 # Security configuration
│       ├── controller/             # REST controllers (Auth, Admin, Employee)
│       ├── dto/                    # Request/Response DTOs
│       ├── entity/                 # JPA entities
│       ├── enums/                  # Application enums
│       ├── exception/              # Global exception handling
│       ├── repository/             # Spring Data repositories
│       ├── security/               # JWT service & filters
│       ├── service/                # Business logic
│       └── tenant/                 # Tenant context
│
├── Frontend/                       # React frontend
│   └── src/
│       ├── app/                    # App entry, providers, query client
│       ├── components/             # Shared UI & feedback components
│       ├── contexts/               # Auth, Theme, Toast contexts
│       ├── features/               # Feature modules (auth, departments, employees, leave)
│       ├── hooks/                  # Custom hooks
│       ├── layouts/                # App & Auth layouts
│       ├── pages/                  # Route pages
│       ├── routes/                 # Router, navigation, guards
│       ├── services/               # API service layer (axios)
│       ├── styles/                 # Global CSS
│       ├── types/                  # TypeScript type definitions
│       └── utils/                  # Helpers (errors, token storage, query invalidation)
```

## Getting Started

### Prerequisites

- Java 20+
- Node.js 18+
- PostgreSQL
- npm or yarn

### Backend Setup

```bash
cd hr-saas

# Create the database
psql -U postgres -c "CREATE DATABASE hr_saas;"

# Set environment variables (or use defaults)
export DB_URL=jdbc:postgresql://localhost:5432/hr_saas
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=your-secret-key
export MAIL_USERNAME=your-email@gmail.com
export MAIL_APP_PASSWORD=your-app-password

# Run the application
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | Backend server port |
| `DB_URL` | `jdbc:postgresql://localhost:5432/hr_saas` | PostgreSQL connection URL |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | — | Secret key for JWT signing (required) |
| `JWT_ACCESS_EXPIRATION_MS` | `3600000` | Access token expiry (1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` | Refresh token expiry (7 days) |
| `MAIL_USERNAME` | — | SMTP email address |
| `MAIL_APP_PASSWORD` | — | SMTP app password |
| `MAIL_FROM_ADDRESS` | `no-reply@hrsaas.com` | Sender email address |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | Frontend URL for email links |
| `INVITE_EXPIRATION_HOURS` | `72` | Invite token validity period |
| `SHOW_SQL` | `false` | Log SQL statements |

### Frontend

Create a `.env` or `.env.local` file in `Frontend/`:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (default: `http://localhost:8080`) |

## Docker

```bash
cd hr-saas

# Build and run with docker-compose
docker-compose up --build
```

## API Documentation

See the [backend README](hr-saas/README.md) for full API endpoint documentation including request/response examples.

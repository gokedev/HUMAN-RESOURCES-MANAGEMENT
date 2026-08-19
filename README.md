# CoralHR — Human Resources Management System

A full-stack multi-tenant HR management platform that allows companies to register, invite employees, and manage their workforce from a single dashboard.

**Live demo:** [coral-sooty.vercel.app](https://coral-sooty.vercel.app) (Frontend) | [hr-saas-cmra.onrender.com](https://hr-saas-cmra.onrender.com) (Backend API)

---

## Features

| Feature | Description |
|---|---|
| **Company Registration & Multi-Tenancy** | Each company gets an isolated workspace with slug-based tenant isolation |
| **JWT Authentication** | Secure login with short-lived access tokens (1h) and refresh token rotation (7d) |
| **Role-Based Access Control** | `ADMIN` and `EMPLOYEE` roles enforced server-side via URL patterns + `RoleGuard` |
| **Employee Management** | Create, view, update, deactivate, and reactivate employee profiles |
| **Employee Invitations** | Email-based invite flow with token expiration (72h), resend, and revoke |
| **Styled Transactional Emails** | Beautiful HTML emails for welcome, invitation, leave status, and password reset |
| **Department Management** | Create, list, and delete departments with employee count tracking |
| **Attendance Tracking** | Daily check-in / check-out with status tracking (PRESENT, ABSENT, HALF_DAY, ON_LEAVE) |
| **Leave Management** | Submit, review (approve/reject), and cancel leave requests with email notifications |
| **Payroll** | Generate payslips with unpaid-leave deductions and flat tax, employee payslip viewing |
| **Dashboard Analytics** | Headcount trends, employee counts, leave statistics, attendance compliance charts |
| **Profile & Settings** | Employee self-service for profile updates, password changes, and theme preferences |
| **Dark Mode** | Theme toggle with localStorage persistence |

---

## Tech Stack

### Backend (`hr-saas/`)

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Runtime |
| Spring Boot | 3.3.4 | Framework |
| Spring Security | — | Authentication & authorization |
| Spring Data JPA | — | Database access with Hibernate |
| PostgreSQL | 16 | Database |
| Flyway | — | Database migrations |
| JJWT | 0.12.6 | JWT token generation and validation |
| BCrypt | — | Password hashing |
| Caffeine | — | In-memory caching (departments) |
| SpringDoc OpenAPI | 2.6.0 | Swagger UI / API documentation |
| Brevo API | — | Transactional email delivery |
| spring-dotenv | 4.0.0 | `.env` file loading |
| Lombok | 1.18.36 | Boilerplate reduction |

### Frontend (`Frontend/`)

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1 | UI library |
| JavaScript (JSX) | — | Component syntax |
| Vite | 7.x | Build tool and dev server |
| React Router | 7.x | Client-side routing with route guards |
| TanStack Query | 5.x | Server state management, caching, and invalidation |
| React Hook Form | 7.x | Form state management |
| Zod | 4.x | Schema validation |
| Axios | 1.x | HTTP client with interceptors for token refresh |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Lucide React | — | Icon library |

---

## Project Structure

```
Hr-managements-system/
├── hr-saas/                              # Spring Boot backend
│   ├── src/main/java/com/hrsaas/
│   │   ├── config/                       # Security, CORS, cache, Swagger config
│   │   ├── controller/                   # REST controllers (Auth, Admin, Employee)
│   │   ├── dto/                          # Request/Response DTOs with validation
│   │   ├── entity/                       # JPA entities (User, Company, LeaveRequest, etc.)
│   │   ├── enums/                        # Role, LeaveType, LeaveStatus, UserStatus, etc.
│   │   ├── exception/                    # Global exception handling
│   │   ├── repository/                   # Spring Data JPA repositories
│   │   ├── security/                     # JWT service, auth filter, RoleGuard
│   │   ├── service/                      # Business logic (Auth, Employee, Leave, etc.)
│   │   └── tenant/                       # TenantContext (ThreadLocal for multi-tenancy)
│   ├── src/main/resources/
│   │   ├── application.yml               # Default config
│   │   ├── application-dev.yml           # Development overrides
│   │   ├── application-prod.yml          # Production overrides
│   │   └── db/migration/                 # Flyway SQL migrations
│   ├── src/test/java/com/hrsaas/        # JUnit tests
│   ├── .env.example                      # Environment variable template
│   ├── docker-compose.yml                # Local Docker setup (PostgreSQL + backend)
│   ├── Dockerfile                        # Production container image
│   └── pom.xml                           # Maven dependencies
│
├── Frontend/                             # React frontend
│   └── src/
│       ├── main.jsx                      # App entry point
│       ├── App.jsx                       # Root component with providers
│       ├── router.jsx                    # Route definitions with guards
│       ├── api.js                        # Axios client + service layer
│       ├── constants.js                  # Query keys, storage keys, enums
│       ├── utils.js                      # Error handling, formatters, token storage, cache invalidation
│       ├── hooks/                        # Custom hooks (useTodayAttendance, usePageTitle, etc.)
│       ├── contexts/                     # Auth, Theme, Toast context providers
│       ├── layouts/                      # App layout (sidebar) and Auth layout
│       ├── components/
│       │   ├── ui/                       # Reusable UI primitives (Button, Card, Dialog, etc.)
│       │   ├── common/                   # Shared components (Brand, charts, barrel exports)
│       │   └── feedback/                 # ErrorBoundary, offline indicator
│       ├── features/
│       │   ├── auth/                     # Login, Register, Forgot/Reset Password, Accept Invitation
│       │   ├── dashboard/                # Admin & Employee dashboards with analytics
│       │   ├── employees/                # Employee CRUD (list, create, details, edit)
│       │   ├── departments/              # Department management
│       │   ├── attendance/               # Admin attendance view + Employee check-in/out
│       │   ├── leave/                    # Leave request submission + admin review
│       │   ├── payroll/                  # Payroll generation + employee payslip viewing
│       │   ├── profile/                  # Profile editing, password change, theme
│       │   └── settings/                 # App settings
│       └── styles/                       # Global CSS (Tailwind imports)
│
├── render.yaml                           # Render deployment config
└── README.md                             # This file
```

---

## Getting Started

### Prerequisites

- **Backend:** Java 21+, PostgreSQL 16+ (or Docker)
- **Frontend:** Node.js 18+, npm

### Backend Setup

```bash
cd hr-saas

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT_SECRET

# Option A: Docker (recommended)
docker-compose up --build

# Option B: Local
# Create the database first
psql -U postgres -c "CREATE DATABASE hr_saas;"

# Run the application (Flyway handles migrations automatically)
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`. Swagger UI is available at `http://localhost:8080/swagger-ui.html`.

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend starts on `http://localhost:5173`.

### Docker (Full Stack)

```bash
cd hr-saas
docker-compose up --build
```

This starts PostgreSQL on port 5432 and the backend on port 8080. Set the frontend's `VITE_API_BASE_URL` to `http://localhost:8080`.

---

## Environment Variables

### Backend

| Variable | Default | Required | Description |
|---|---|---|---|
| `SERVER_PORT` | `8080` | No | Backend server port |
| `DB_URL` | `jdbc:postgresql://localhost:5432/hr_saas` | No | PostgreSQL connection URL |
| `DB_USERNAME` | `postgres` | No | Database username |
| `DB_PASSWORD` | `postgres` | No | Database password |
| `JWT_SECRET` | — | **Yes** | Secret key for JWT signing (min 32 chars, use `openssl rand -base64 48`) |
| `JWT_ACCESS_EXPIRATION_MS` | `3600000` | No | Access token expiry (default 1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` | No | Refresh token expiry (default 7 days) |
| `BREVO_API_KEY` | — | **Yes** | Brevo transactional email API key |
| `MAIL_FROM_ADDRESS` | `no-reply@hrsaas.com` | No | Sender email address |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | No | Frontend URL for email links |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | No | Comma-separated allowed CORS origins |
| `INVITE_EXPIRATION_HOURS` | `72` | No | Invitation token validity period |
| `SHOW_SQL` | `false` | No | Log SQL statements |

### Frontend

Create a `.env` or `.env.local` file in `Frontend/`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://hr-saas-cmra.onrender.com` | Backend API base URL |

---

## API Documentation

See the [Backend README](hr-saas/README.md) for complete API endpoint documentation including request/response examples and cURL commands.

### Quick Testing Flow

1. **Register a company** via `POST /api/auth/register-company` — save `accessToken`, `refreshToken`, `companySlug`
2. **Create a department** via `POST /api/admin/departments` — save department `id`
3. **Create an employee** via `POST /api/admin/employees` — they receive an invite email
4. **Employee accepts invitation** via `POST /api/auth/accept-invitation` with the token from the email
5. **Employee logs in** via `POST /api/auth/login` with `email` + `password` + `companySlug`
6. **Employee checks in** and files a leave request
7. **Admin reviews** (approves/rejects) the leave request
8. **Admin generates payroll** and reviews payslips

---

## Deployment

### Frontend (Vercel)

The frontend is deployed on Vercel with automatic deployments from the `master` branch. `Frontend/vercel.json` configures the Vite framework preset and SPA rewrites.

### Backend (Render)

The backend is deployed on Render using the `render.yaml` blueprint. It uses the `Dockerfile` for building. Environment variables are configured in the Render dashboard.

---

## Known Limitations

The following are documented and accepted for the current version:

- **No server-side token revocation on deactivation** — When an employee is deactivated, their access token remains valid until expiry (1h). Refresh tokens are also not revoked. Production systems should revoke all tokens on deactivation.
- **No rate limiting** — Login, forgot-password, and token-refresh endpoints have no rate limiting. Brute-force attacks are unrestricted.
- **Swagger UI publicly accessible** — API documentation is accessible without authentication in all environments.
- **Payroll employee cap** — Payroll generation uses `PageRequest.of(0, 1000)`, silently skipping employees beyond the 1000th. Acceptable for current scale.
- **No frontend tests** — The frontend has no test framework configured. Backend has minimal unit tests (6 tests covering employee creation and leave request creation only).
- **Unused dependencies** — `cmdk` and `recharts` are installed but not actively imported. `recharts` was replaced by a custom chart component.

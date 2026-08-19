# CoralHR — Frontend

React single-page application for the CoralHR multi-tenant HR management platform.

**Live:** [coral-sooty.vercel.app](https://coral-sooty.vercel.app)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1 | UI library |
| JavaScript (JSX) | — | Component syntax (not TypeScript) |
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
Frontend/src/
├── main.jsx                      # App entry point
├── App.jsx                       # Root component with providers
├── router.jsx                    # Route definitions with role-based guards
├── constants.js                  # Query keys, storage keys, leave types
├── utils.js                      # Error handling, formatters, token storage, cache invalidation
│
├── api/                          # API layer (one file per domain)
│   ├── index.js                  # Barrel re-exports for all services
│   ├── client.js                 # Axios instance, interceptors, token refresh logic
│   ├── auth.js                   # Login, register, refresh, password reset
│   ├── employees.js              # Employee CRUD, status changes, analytics
│   ├── departments.js            # Department CRUD
│   ├── attendance.js             # Check-in/out, list, analytics
│   ├── leave.js                  # Leave requests, balance, review, analytics
│   ├── profile.js                # Employee self-service profile
│   └── payroll.js                # Payroll generation, payslip listing
│
├── hooks/                        # Custom hooks (useTodayAttendance, usePageTitle, useTheme)
├── contexts/                     # Auth, Theme, Toast context providers
├── layouts/                      # AppLayout (sidebar + header) and AuthLayout (centered card)
│
├── components/
│   ├── ui/                       # Reusable UI primitives (Button, Card, Dialog, Input, etc.)
│   ├── common/                   # Shared components (Brand, charts, barrel exports)
│   └── feedback/                 # ErrorBoundary, offline indicator
│
├── features/
│   ├── auth/                     # Login, Register, ForgotPassword, ResetPassword, AcceptInvitation
│   ├── dashboard/                # DashboardPage (thin wrapper)
│   │   ├── AdminDashboard.jsx    # Admin metrics, charts, quick actions
│   │   ├── EmployeeDashboard.jsx # Employee attendance, leave, quick actions
│   │   └── shared.jsx           # MetricCard, QuickAction, getGreeting
│   ├── employees/                # EmployeesPage, CreateEmployee, EmployeeDetails, EditEmployee
│   ├── departments/              # DepartmentsPage
│   ├── attendance/               # AttendancePage (admin), MyAttendancePage (employee)
│   ├── leave/                    # LeaveRequestsPage (admin), MyLeavePage, LeaveModals
│   ├── payroll/                  # PayrollPage (admin), MyPayslipsPage, PayslipViewModal
│   ├── profile/                  # ProfilePage (thin wrapper)
│   │   ├── PersonalTab.jsx       # Profile view/edit form
│   │   ├── PasswordTab.jsx       # Password change form
│   │   ├── AppearanceTab.jsx     # Theme toggle
│   │   ├── SecurityTab.jsx       # Session info
│   │   └── ProfileField.jsx      # Reusable label+value component
│   └── settings/                 # SettingsPage
│
└── styles/                       # Global CSS (Tailwind imports)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local if needed (VITE_API_BASE_URL defaults to https://hr-saas-cmra.onrender.com)

# Start dev server
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://hr-saas-cmra.onrender.com` | Backend API base URL |

---

## Architecture

### Authentication Flow

1. User logs in via `POST /api/auth/login` with email + password + companySlug
2. Backend returns `accessToken` (1h) + `refreshToken` (7d) + role + companySlug
3. Tokens stored in `localStorage` via `utils.js` token storage helpers
4. Axios interceptor attaches `Authorization: Bearer <token>` to every request
5. On 401, interceptor calls `POST /api/auth/refresh` with the refresh token to get a new pair
6. If refresh also fails, user is logged out and redirected to `/login`

### Route Guards

- `PublicRoute` — redirects authenticated users away from login/register
- `ProtectedRoute` — requires valid auth, redirects to `/login` if not
- `RoleGuard` — restricts routes to specific roles (e.g. `/admin/*` requires ADMIN)

### State Management

- **Server state:** TanStack Query handles all API data fetching, caching, and invalidation
- **Client state:** React Context for auth (user, tokens, login/logout), theme, and toasts
- **Form state:** React Hook Form + Zod validation

### API Layer

Services are split by domain under `src/api/`, one file per resource:

| File | Domain | Key Methods |
|---|---|---|
| `client.js` | Infrastructure | Axios instance, interceptors, token refresh |
| `auth.js` | Authentication | login, register, refresh, forgotPassword, resetPassword |
| `employees.js` | Employee management | listAll, create, update, deactivate, reactivate, analytics |
| `departments.js` | Departments | list, create, delete |
| `attendance.js` | Attendance | checkIn, checkOut, listMine, listCompany, analytics |
| `leave.js` | Leave requests | createMine, listMine, cancelMine, review, getMyBalance |
| `profile.js` | Self-service | me, update |
| `payroll.js` | Payroll | generate, listForPeriod, listMine |

### Multi-Tenancy

The `companySlug` is stored alongside tokens and sent with login. The backend uses it to scope all data to the current company via `TenantContext` (ThreadLocal). The frontend does not need to pass the slug in API calls — it's embedded in the JWT.

---

## Known Limitations

- **No frontend tests** — No test framework is configured. Adding Vitest + React Testing Library would be the natural next step.
- **No i18n** — All strings are hardcoded in English. No internationalization support.
- **No offline support** — The app requires a network connection.
- **Bundle size** — The main chunk is ~657 KB (195 KB gzipped). Code splitting with dynamic imports would reduce initial load time.

import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts.jsx";
import { AppLayout, AuthLayout } from "./layouts/index.jsx";
import {
  NotFoundPage,
  UnauthorizedPage,
  SessionExpiredPage,
  ServerErrorPage,
} from "./statusPages.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  AcceptInvitationPage,
} from "./features/auth/RecoveryPages.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { RegisterCompanyPage } from "./features/auth/RegisterCompanyPage.jsx";
import { EmployeesPage } from "./features/employees/EmployeesPage.jsx";
import { NewEmployeePage } from "./features/employees/NewEmployeePage.jsx";
import { EmployeeDetailsPage } from "./features/employees/EmployeeDetailsPage.jsx";
import { EditEmployeePage } from "./features/employees/EditEmployeePage.jsx";
import { DepartmentsPage } from "./features/departments/DepartmentsPage.jsx";
import { AttendancePage } from "./features/attendance/AttendancePage.jsx";
import { LeaveRequestsPage } from "./features/leave/LeaveRequestsPage.jsx";
import { ProfilePage } from "./features/profile/ProfilePage.jsx";
import { MyLeavePage } from "./features/leave/MyLeavePage.jsx";
import { MyAttendancePage } from "./features/attendance/MyAttendancePage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";

export const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Employees", path: "/employees", icon: "Users", roles: ["ADMIN"] },
  { label: "Departments", path: "/departments", icon: "Building2", roles: ["ADMIN"] },
  { label: "Attendance", path: "/attendance", icon: "ClipboardCheck", roles: ["ADMIN"] },
  { label: "Leave Requests", path: "/leave", icon: "CalendarDays", roles: ["ADMIN"] },
  { label: "My Attendance", path: "/my-attendance", icon: "Clock3", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "My Leave", path: "/my-leave", icon: "CalendarRange", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Profile", path: "/profile", icon: "UserRound", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Settings", path: "/settings", icon: "Settings", roles: ["ADMIN", "EMPLOYEE"] },
];

// Guard redirects unauthenticated users to the login screen while remembering where they wanted to go.
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

// RoleGuard blocks admin-only pages for employees and redirects them to a friendly notice.
function RoleGuard({ children, roles }) {
  const { role } = useAuth();
  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// The router is the app's navigation map. It keeps public auth pages separate from protected dashboard pages.
export const router = createBrowserRouter([
  {
    // Public pages use the auth layout and do not require a token.
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register-company", element: <RegisterCompanyPage /> },
      // Keep the short alias so older links to /register still work.
      { path: "/register", element: <RegisterCompanyPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/accept-invitation", element: <AcceptInvitationPage /> },
    ],
  },
  {
    // Everything under AppLayout requires a valid saved session.
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard is the landing page for both ADMIN and EMPLOYEE roles.
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        // Admin-only workforce management.
        path: "employees",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <EmployeesPage />
          </RoleGuard>
        ),
      },
      {
        path: "employees/new",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <NewEmployeePage />
          </RoleGuard>
        ),
      },
      {
        path: "employees/:id",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <EmployeeDetailsPage />
          </RoleGuard>
        ),
      },
      {
        path: "employees/:id/edit",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <EditEmployeePage />
          </RoleGuard>
        ),
      },
      {
        path: "departments",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <DepartmentsPage />
          </RoleGuard>
        ),
      },
      {
        path: "attendance",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <AttendancePage />
          </RoleGuard>
        ),
      },
      {
        path: "leave",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <LeaveRequestsPage />
          </RoleGuard>
        ),
      },
      // Self-service pages are allowed for ADMIN and EMPLOYEE per the backend README.
      { path: "profile", element: <ProfilePage /> },
      { path: "my-leave", element: <MyLeavePage /> },
      { path: "my-attendance", element: <MyAttendancePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "unauthorized", element: <UnauthorizedPage /> },
      // Old URLs redirect to the dedicated pages so existing links and bookmarks still work.
      { path: "organization", element: <Navigate to="/employees" replace /> },
      { path: "operations", element: <Navigate to="/attendance" replace /> },
      { path: "me", element: <Navigate to="/my-attendance" replace /> },
      { path: "leave-requests", element: <Navigate to="/leave" replace /> },
      { path: "my-leave-requests", element: <Navigate to="/my-leave" replace /> },
      { path: "my-attendance-old", element: <Navigate to="/my-attendance" replace /> },
    ],
  },
  // Public status routes stay outside the protected shell.
  { path: "/404", element: <NotFoundPage /> },
  { path: "/401", element: <SessionExpiredPage /> },
  { path: "/500", element: <ServerErrorPage /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);

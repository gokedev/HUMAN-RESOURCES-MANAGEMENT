import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from './guards';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AttendancePage } from '../features/admin/AttendancePage';
import { DashboardPage } from '../features/shared/DashboardPage';
import { DepartmentsPage } from '../features/admin/DepartmentsPage';
import { EmployeeDetailsPage } from '../features/admin/EmployeeDetailsPage';
import { EmployeesPage } from '../features/admin/EmployeesPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LeaveRequestsPage } from '../features/admin/LeaveRequestsPage';
import { LoginPage } from '../features/auth/LoginPage';
import { MyAttendancePage } from '../features/employee/MyAttendancePage';
import { MyLeaveRequestsPage } from '../features/employee/MyLeaveRequestsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../features/shared/ProfilePage';
import { RegisterCompanyPage } from '../features/auth/RegisterCompanyPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { AcceptInvitationPage } from '../features/auth/AcceptInvitationPage';
import { SettingsPage } from '../features/shared/SettingsPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

// The router is the app's navigation map. It keeps public auth pages separate from protected dashboard pages.
export const router = createBrowserRouter([
  {
    // Public pages use the auth layout and do not require a token.
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterCompanyPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/accept-invitation', element: <AcceptInvitationPage /> },
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
      // Dashboard is available to both ADMIN and EMPLOYEE roles.
      { index: true, element: <DashboardPage /> },
      {
        // Admin-only employee management routes match /api/admin/employees.
        path: 'employees',
        element: (
          <RoleGuard roles={['ADMIN']}>
            <EmployeesPage />
          </RoleGuard>
        ),
      },
      {
        // Admin-only detail page is prepared for GET /api/admin/employees/{id}.
        path: 'employees/:id',
        element: (
          <RoleGuard roles={['ADMIN']}>
            <EmployeeDetailsPage />
          </RoleGuard>
        ),
      },
      {
        // Admin-only department page maps to /api/admin/departments.
        path: 'departments',
        element: (
          <RoleGuard roles={['ADMIN']}>
            <DepartmentsPage />
          </RoleGuard>
        ),
      },
      {
        // Admin company-wide attendance page maps to /api/admin/attendance.
        path: 'attendance',
        element: (
          <RoleGuard roles={['ADMIN']}>
            <AttendancePage />
          </RoleGuard>
        ),
      },
      {
        // Admin leave review page maps to /api/admin/leave-requests.
        path: 'leave-requests',
        element: (
          <RoleGuard roles={['ADMIN']}>
            <LeaveRequestsPage />
          </RoleGuard>
        ),
      },
      // Self-service pages are allowed for ADMIN and EMPLOYEE per the backend README.
      { path: 'my-attendance', element: <MyAttendancePage /> },
      { path: 'my-leave', element: <MyLeaveRequestsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  // Public status routes stay outside the protected shell.
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
]);

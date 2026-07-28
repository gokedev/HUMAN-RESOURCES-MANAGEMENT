import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from './guards';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AttendancePage } from '../pages/AttendancePage';
import { DashboardPage } from '../pages/DashboardPage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { EmployeeDetailsPage } from '../pages/EmployeeDetailsPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LeaveRequestsPage } from '../pages/LeaveRequestsPage';
import { LoginPage } from '../pages/LoginPage';
import { MyAttendancePage } from '../pages/MyAttendancePage';
import { MyLeaveRequestsPage } from '../pages/MyLeaveRequestsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterCompanyPage } from '../pages/RegisterCompanyPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage';
import { SettingsPage } from '../pages/SettingsPage';
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

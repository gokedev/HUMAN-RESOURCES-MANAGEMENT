import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts.jsx';
import { AppLayout, AuthLayout } from './layouts.jsx';
import { NotFoundPage, UnauthorizedPage } from './statusPages.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';
import { ForgotPasswordPage, ResetPasswordPage, AcceptInvitationPage } from './features/auth/RecoveryPages.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { MyActivityPage } from './features/me/MyActivityPage.jsx';
import { OperationsPage } from './features/operations/OperationsPage.jsx';
import { OrganizationPage } from './features/organization/OrganizationPage.jsx';
import { ProfilePage } from './features/me/ProfilePage.jsx';
import { RegisterCompanyPage } from './features/auth/RegisterCompanyPage.jsx';

export const navigationItems = [
    { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', roles: ['ADMIN', 'EMPLOYEE'] },
    { label: 'Organization', path: '/organization', icon: 'Users', roles: ['ADMIN'] },
    { label: 'Operations', path: '/operations', icon: 'ClipboardCheck', roles: ['ADMIN'] },
    { label: 'My Activity', path: '/me', icon: 'CalendarDays', roles: ['ADMIN', 'EMPLOYEE'] },
    { label: 'Profile', path: '/profile', icon: 'UserRound', roles: ['ADMIN', 'EMPLOYEE'] },
];

// Guard redirects unauthenticated users to the login screen while remembering where they wanted to go.
function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }}/>;
    }
    return children;
}
// RoleGuard blocks admin-only pages for employees and redirects them to a friendly notice.
function RoleGuard({ children, roles }) {
    const { role } = useAuth();
    if (roles && role && !roles.includes(role)) {
        return <Navigate to="/unauthorized" replace/>;
    }
    return children;
}

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
        element: (<ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>),
        children: [
            // Dashboard is available to both ADMIN and EMPLOYEE roles.
            { index: true, element: <DashboardPage /> },
            {
                // Admin-only organization page merges employee and department management.
                path: 'organization',
                element: (<RoleGuard roles={['ADMIN']}>
            <OrganizationPage />
          </RoleGuard>),
            },
            {
                // Admin-only operations page merges company attendance and leave review.
                path: 'operations',
                element: (<RoleGuard roles={['ADMIN']}>
            <OperationsPage />
          </RoleGuard>),
            },
            // Self-service page merges personal attendance and leave, allowed for ADMIN and EMPLOYEE per the backend README.
            { path: 'me', element: <MyActivityPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'unauthorized', element: <UnauthorizedPage /> },
            // Old URLs redirect to the merged pages so existing links and bookmarks still work.
            { path: 'employees', element: <Navigate to="/organization" replace/> },
            { path: 'departments', element: <Navigate to="/organization" replace/> },
            { path: 'attendance', element: <Navigate to="/operations" replace/> },
            { path: 'leave-requests', element: <Navigate to="/operations" replace/> },
            { path: 'my-attendance', element: <Navigate to="/me" replace/> },
            { path: 'my-leave', element: <Navigate to="/me" replace/> },
        ],
    },
    // Public status routes stay outside the protected shell.
    { path: '/404', element: <NotFoundPage /> },
    { path: '*', element: <Navigate to="/404" replace/> },
]);

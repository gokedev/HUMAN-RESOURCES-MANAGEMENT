import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { navigationItems } from '../routes/navigation';
import { OfflineBanner } from '../components/feedback/OfflineBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  FileEdit, LayoutDashboard, Users, Building2, ClipboardCheck,
  FileClock, Clock3, CalendarDays, UserRound, Settings,
  Bell, Moon, Sun, LogOut,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, Building2, ClipboardCheck,
  FileClock, Clock3, CalendarDays, UserRound, Settings,
};

// Converts the active URL into a readable breadcrumb label for the top bar.
function formatBreadcrumb(pathname: string) {
  if (pathname === '/') {
    return 'Dashboard';
  }

  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replaceAll('-', ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

export function AppLayout() {
  // Auth supplies the current user role, tenant slug, and logout action.
  const { session, role, logout } = useAuth();
  // Theme controls the icon button and document theme state.
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  // Navigation is filtered at render time so each role only sees permitted pages.
  const allowedItems = navigationItems.filter((item) => role && item.roles.includes(role));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="app-shell">
      {/* Sidebar provides primary dashboard navigation on desktop and wraps on smaller screens. */}
      <aside className="sidebar">
        <Link to="/" className="brand-mark sidebar-brand">
          <span className="brand-icon">
            <FileEdit size={20} />
          </span>
          <span>HRMS</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {allowedItems.map((item, idx) => {
            const Icon = iconMap[item.icon];
            const isAdminSection = item.roles.length === 1 && item.roles[0] === 'ADMIN';
            const prevItem = idx > 0 ? allowedItems[idx - 1] : null;
            const prevIsAdmin = prevItem?.roles.length === 1 && prevItem?.roles[0] === 'ADMIN';
            const showDivider = idx > 0 && isAdminSection !== prevIsAdmin;
            return (
              <span key={item.path}>
                {showDivider && <span className="sidebar-divider" />}
                <NavLink to={item.path} className="sidebar-link">
                  {Icon && <Icon size={20} />}
                  <span>{item.label}</span>
                </NavLink>
              </span>
            );
          })}
        </nav>
      </aside>
      <div className="app-main">
        {/* OfflineBanner appears only when the browser reports no network connection. */}
        <OfflineBanner />
        {/* Topbar contains context, notifications, theme toggle, profile summary, and logout. */}
        <header className="topbar">
          <div>
            <span className="breadcrumb-label">{formatBreadcrumb(location.pathname)}</span>
            <p className="topbar-context">{session?.companySlug}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" title="Notifications" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="icon-button" type="button" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="profile-chip">
              <span className="profile-avatar">{session?.email.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{session?.email}</strong>
                <span>{role}</span>
              </div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut size={16} style={{ marginRight: '0.35rem' }} /> Logout
            </button>
          </div>
        </header>
        {/* Outlet renders whichever protected route is currently active. */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      {showLogoutConfirm && (
        <ConfirmDialog
          title="Sign out"
          message="Are you sure you want to sign out of your workspace?"
          confirmLabel="Sign out"
          variant="danger"
          onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

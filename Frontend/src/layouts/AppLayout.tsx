import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { navigationItems } from '../routes/navigation';
import { OfflineBanner } from '../components/feedback/OfflineBanner';

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

  return (
    <div className="app-shell">
      {/* Sidebar provides primary dashboard navigation on desktop and wraps on smaller screens. */}
      <aside className="sidebar">
        <Link to="/" className="brand-mark sidebar-brand">
          <span className="brand-icon bi bi-command" aria-hidden="true" />
          <span>HRMS</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {allowedItems.map((item) => (
            <NavLink key={item.path} to={item.path} className="sidebar-link">
              <span className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
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
              <span className="bi bi-bell" aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
              <span className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
            </button>
            <div className="profile-chip">
              <span className="profile-avatar">{session?.email.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{session?.email}</strong>
                <span>{role}</span>
              </div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={logout}>
              <span className="bi bi-box-arrow-right" aria-hidden="true" /> Logout
            </button>
          </div>
        </header>
        {/* Outlet renders whichever protected route is currently active. */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

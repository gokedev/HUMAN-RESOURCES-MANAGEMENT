import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FileEdit,
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  CalendarDays,
  Clock3,
  CalendarRange,
  UserRound,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useAuth, useTheme } from "../contexts.jsx";
import { navigationItems } from "../router.jsx";
import { OfflineBanner } from "../components/feedback.jsx";
import { ConfirmDialog } from "../components/common/ui.jsx";

const iconMap = {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  CalendarDays,
  Clock3,
  CalendarRange,
  UserRound,
  Settings,
};
// Converts the active URL into a readable breadcrumb label for the top bar.
function formatBreadcrumb(pathname) {
  if (pathname === "/" || pathname === "/dashboard") {
    return "Dashboard";
  }
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replaceAll("-", " "))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" / ");
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Close the drawer whenever the active route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  // Close the drawer with the Escape key.
  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);
  return (
    <div className="app-shell">
      {/* Sidebar provides primary dashboard navigation on desktop and becomes an off-canvas drawer on smaller screens. */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <Link
          to="/dashboard"
          className="brand-mark sidebar-brand"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="brand-icon">
            <FileEdit size={20} />
          </span>
          <span>HRMS</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {allowedItems.map((item, idx) => {
            const Icon = iconMap[item.icon];
            const isAdminItem = item.roles.length === 1 && item.roles[0] === "ADMIN";
            const prevItem = idx > 0 ? allowedItems[idx - 1] : null;
            const prevIsAdmin = prevItem?.roles.length === 1 && prevItem?.roles[0] === "ADMIN";
            const showDivider = idx > 0 && isAdminItem !== prevIsAdmin;
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
      {/* Backdrop closes the mobile drawer when tapping outside it. */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="app-main">
        {/* OfflineBanner appears only when the browser reports no network connection. */}
        <OfflineBanner />
        {/* Topbar contains context, theme toggle, profile summary, and logout. */}
        <header className="topbar">
          <div className="topbar-context-group">
            <button
              className="icon-button menu-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <span className="breadcrumb-label">
                {formatBreadcrumb(location.pathname)}
              </span>
              <p className="topbar-context">{session?.companySlug}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="profile-chip">
              <span className="profile-avatar">
                {(session?.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="profile-chip-text">
                <strong>{session?.email}</strong>
                <span>{role}</span>
              </div>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm logout-btn"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={16} /> <span className="logout-label">Logout</span>
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
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <Link to="/login" className="brand-mark">
          <span className="brand-icon">
            <FileEdit size={20} />
          </span>
          <span>HRMS</span>
        </Link>
        <div className="auth-brand-copy">
          <span className="page-eyebrow">Enterprise HR platform</span>
          <h1>People operations with the control room built in.</h1>
          <p>
            Manage teams, attendance, leave workflows, and company access from
            one polished workspace.
          </p>
        </div>
      </section>
      <section className="auth-form-panel">
        <Outlet />
      </section>
    </main>
  );
}

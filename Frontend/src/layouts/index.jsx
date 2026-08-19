import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, ClipboardCheck, CalendarDays,
  Clock3, CalendarRange, UserRound, Settings, Menu, Moon, Sun, LogOut,
  Wallet, Receipt,
} from "lucide-react";
import { useAuth, useTheme } from "../contexts.jsx";
import { navigationItems } from "../router.jsx";
import { OfflineBanner } from "../components/feedback.jsx";
import { ConfirmDialog } from "../components/ui/dialog.jsx";
import { LogoMark } from "../components/common/Brand.jsx";
import { Button } from "../components/ui/button.jsx";
import { AvatarGradient } from "../components/ui/avatar.jsx";
import { cn } from "../lib/utils.js";

const iconMap = {
  LayoutDashboard, Users, Building2, ClipboardCheck,
  CalendarDays, Clock3, CalendarRange, UserRound, Settings,
  Wallet, Receipt,
};

function formatBreadcrumb(pathname) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  return pathname
    .split("/").filter(Boolean)
    .map((s) => s.replaceAll("-", " "))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

function SidebarNav({ items, onNavigate }) {
  return (
    <nav className="flex-1 p-3 space-y-0.5" aria-label="Primary navigation">
      {items.map((item, idx) => {
        const Icon = iconMap[item.icon];
        const isAdminItem = item.roles.length === 1 && item.roles[0] === "ADMIN";
        const prevItem = idx > 0 ? items[idx - 1] : null;
        const prevIsAdmin = prevItem?.roles.length === 1 && prevItem?.roles[0] === "ADMIN";
        const showDivider = idx > 0 && isAdminItem !== prevIsAdmin;
        return (
          <span key={item.path}>
            {showDivider && <div className="h-px bg-border my-2 mx-3" />}
            <NavLink
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-all duration-150 no-underline",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {Icon && <Icon className="h-[18px] w-[18px]" />}
              <span>{item.label}</span>
            </NavLink>
          </span>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const { session, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const allowedItems = navigationItems.filter((item) => role && item.roles.includes(role));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] sticky top-0 h-screen bg-card border-r border-border overflow-y-auto shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-border no-underline" onClick={() => setSidebarOpen(false)}>
          <LogoMark size={28} />
          <span className="text-lg font-extrabold text-foreground">CoralHR</span>
        </Link>
        <SidebarNav items={allowedItems} />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <AvatarGradient className="h-8 w-8 text-xs shrink-0" name={session?.email}>
              {(session?.email ?? "?").charAt(0).toUpperCase()}
            </AvatarGradient>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{session?.email}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[1030] bg-black/50 lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[1040] w-[280px] h-screen bg-card border-r border-border overflow-y-auto lg:hidden transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-border no-underline" onClick={() => setSidebarOpen(false)}>
          <LogoMark size={28} />
          <span className="text-lg font-extrabold text-foreground">CoralHR</span>
        </Link>
        <SidebarNav items={allowedItems} onNavigate={() => setSidebarOpen(false)} />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <AvatarGradient className="h-8 w-8 text-xs shrink-0" name={session?.email}>
              {(session?.email ?? "?").charAt(0).toUpperCase()}
            </AvatarGradient>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{session?.email}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <OfflineBanner />
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-4 lg:px-8 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors duration-150"
              type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-sm">{formatBreadcrumb(location.pathname)}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{session?.companySlug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-border bg-card">
              <AvatarGradient className="h-8 w-8 text-xs" name={session?.email}>
                {(session?.email ?? "?").charAt(0).toUpperCase()}
              </AvatarGradient>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[160px]">{session?.email}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 w-full max-w-[1240px] mx-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Sign out"
          message="Are you sure you want to sign out of your workspace?"
          confirmLabel="Sign out"
          variant="destructive"
          onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

export function AuthLayout() {
  return (
    <main className="grid lg:grid-cols-[1fr_minmax(420px,560px)] min-h-screen bg-background">
      <section className="hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-slate-900/70 to-slate-900/80 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.66), rgba(15, 23, 42, 0.72)), url("https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80")`,
        }}
      >
        <Link to="/login" className="inline-flex items-center gap-3 text-white no-underline">
          <LogoMark size={28} />
          <span className="text-lg font-extrabold">CoralHR</span>
        </Link>
        <div className="max-w-md">
          <span className="text-xs font-bold uppercase tracking-wider text-coral">Enterprise HR platform</span>
          <h1 className="mt-2 mb-4 text-4xl font-extrabold text-white leading-tight">
            People operations with the control room built in.
          </h1>
          <p className="text-white/80">
            Manage teams, attendance, leave workflows, and company access from one polished workspace.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center p-8 min-h-screen">
        <Outlet />
      </section>
    </main>
  );
}

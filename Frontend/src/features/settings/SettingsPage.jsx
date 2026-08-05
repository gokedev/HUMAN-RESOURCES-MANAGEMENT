import { Building2, Link as LinkIcon, Palette, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/common/ui.jsx";
import { usePageTitle } from "../../hooks.js";
import { useAuth, useTheme } from "../../contexts.jsx";

export function SettingsPage() {
  usePageTitle("Settings");
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace information and account preferences."
      />

      <section className="table-shell" style={{ marginBottom: "1rem" }}>
        <div className="table-shell-header">
          <div>
            <h2>
              <Building2 size={16} style={{ marginRight: "0.4rem" }} /> Workspace
            </h2>
            <p>Company-level information for your workspace.</p>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div className="form-grid">
            <div>
              <strong>Company slug</strong>
              <p>{session?.companySlug ?? "—"}</p>
            </div>
            <div>
              <strong>Signed in as</strong>
              <p>{session?.email ?? "—"}</p>
            </div>
            <div>
              <strong>Role</strong>
              <p>{session?.role ?? "—"}</p>
            </div>
          </div>
          <p style={{ color: "var(--app-muted)", margin: "1rem 0 0", fontSize: "0.9rem" }}>
            Company profile editing is not available through the API yet. Manage teams from the
            departments screen.
          </p>
          {session?.role === "ADMIN" ? (
            <Link className="btn btn-outline-secondary" to="/departments" style={{ marginTop: "0.5rem" }}>
              <LinkIcon size={16} style={{ marginRight: "0.35rem" }} /> Manage departments
            </Link>
          ) : null}
        </div>
      </section>

      <section className="table-shell" style={{ marginBottom: "1rem" }}>
        <div className="table-shell-header">
          <div>
            <h2>
              <Palette size={16} style={{ marginRight: "0.4rem" }} /> Appearance
            </h2>
            <p>Toggle between light and dark mode to match your preference.</p>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div className="form-row">
            <div>
              <strong>Theme</strong>
              <p style={{ margin: "0.25rem 0 0", color: "var(--app-muted)", fontSize: "0.85rem" }}>
                Current: {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <button className="btn btn-outline-primary" type="button" onClick={toggleTheme}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </section>

      <section className="table-shell">
        <div className="table-shell-header">
          <div>
            <h2>
              <ShieldCheck size={16} style={{ marginRight: "0.4rem" }} /> Security
            </h2>
            <p>Password resets are sent to your email.</p>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <p style={{ color: "var(--app-muted)" }}>
            Use the reset flow to set a new password for your account.
          </p>
          <Link className="btn btn-outline-primary" to="/forgot-password" style={{ marginTop: "0.5rem" }}>
            Reset password
          </Link>
        </div>
      </section>
    </>
  );
}

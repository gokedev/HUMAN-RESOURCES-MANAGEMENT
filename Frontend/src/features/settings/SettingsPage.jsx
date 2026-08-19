import { Building2, Link as LinkIcon, Palette, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/common/ui.jsx";
import { usePageTitle } from "../../hooks.js";
import { useAuth, useTheme } from "../../contexts.jsx";
import { Button } from "../../components/ui/button.jsx";

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

      <div className="space-y-6">
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                <Building2 size={16} className="inline mr-1.5 align-text-bottom" /> Workspace
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Company-level information for your workspace.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SettingsField label="Company slug">{session?.companySlug ?? "—"}</SettingsField>
              <SettingsField label="Signed in as">{session?.email ?? "—"}</SettingsField>
              <SettingsField label="Role">{session?.role ?? "—"}</SettingsField>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Company profile editing is not available through the API yet. Manage teams from the
              departments screen.
            </p>
            {session?.role === "ADMIN" ? (
              <Link className="mt-4 inline-block" to="/departments">
                <Button variant="outline">
                  <LinkIcon size={16} /> Manage departments
                </Button>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                <Palette size={16} className="inline mr-1.5 align-text-bottom" /> Appearance
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Toggle between light and dark mode to match your preference.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</span>
                <p className="mt-1 text-sm text-foreground">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
              <Button variant="outline" type="button" onClick={toggleTheme}>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                <ShieldCheck size={16} className="inline mr-1.5 align-text-bottom" /> Security
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Password resets are sent to your email.</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              Use the reset flow to set a new password for your account.
            </p>
            <Link className="mt-4 inline-block" to="/forgot-password">
              <Button variant="outline">Reset password</Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function SettingsField({ label, children }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm text-foreground">{children}</p>
    </div>
  );
}

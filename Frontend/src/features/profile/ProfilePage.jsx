import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Palette, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common/ui.jsx";
import { CardSkeleton } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useTheme } from "../../contexts.jsx";
import { departmentService, profileService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { Button } from "../../components/ui/button.jsx";

const tabs = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "password", label: "Change Password", icon: KeyRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export function ProfilePage() {
  usePageTitle("Profile");
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("personal");
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.me(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const departmentName = departments.find((dept) => dept.id === profile?.departmentId)?.name;

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your employee identity, preferences, and account security."
      />

      <section className="flex items-center justify-between gap-4 p-5 border border-border rounded-xl bg-card shadow-sm" style={{ alignItems: "flex-start" }}>
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <>
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4e6a] text-white text-xl font-bold shrink-0">
              {(profile?.firstName ?? "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="font-semibold text-foreground">
                {profile ? `${profile.firstName} ${profile.lastName}` : "Your account"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {profile
                  ? `${profile.jobTitle ?? "No job title"} · ${profile.email}`
                  : "Your employee profile could not be loaded."}
              </p>
            </div>
          </>
        )}
      </section>

      <div className="grid grid-cols-[220px_1fr] gap-4 items-start" style={{ marginTop: "1rem" }}>
        <nav className="border border-border rounded-xl p-1.5 bg-card" aria-label="Profile sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full px-3 py-2 text-start ${activeTab === id ? "bg-primary text-white" : ""}`}
              type="button"
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} className="mr-2" /> {label}
            </button>
          ))}
        </nav>

        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {activeTab === "personal" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Account details</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Your personal information and workspace access.</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Email</strong>
                    <p>{profile?.email ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Role</strong>
                    <p>{profile?.role ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <p>{profile?.status ? <StatusBadge status={profile.status} /> : "—"}</p>
                  </div>
                  <div>
                    <strong>Job Title</strong>
                    <p>{profile?.jobTitle ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Department</strong>
                    <p>{departmentName ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Phone</strong>
                    <p>{profile?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Hire Date</strong>
                    <p>
                      {profile?.dateOfHire
                        ? new Date(profile.dateOfHire).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "password" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Change password</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Keep your account secure by using a strong, unique password.</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-muted-foreground">
                  Password resets are sent to your email. Use the reset flow below to set a new
                  password.
                </p>
                <Link className="mt-2 inline-block" to="/forgot-password">
                  <Button variant="outline">Reset password</Button>
                </Link>
              </div>
            </>
          )}

          {activeTab === "appearance" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Appearance</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Toggle between light and dark mode to match your preference.</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Theme</strong>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current: {theme === "dark" ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                  <Button variant="outline" type="button" onClick={toggleTheme}>
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Security</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Session and workspace information.</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Signed in as</strong>
                    <p>{profile?.email ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Role</strong>
                    <p>{profile?.role ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Workspace</strong>
                    <p>{profile?.company?.name ?? "—"}</p>
                  </div>
                  <div>
                    <strong>Theme preference</strong>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Stored locally on this device.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

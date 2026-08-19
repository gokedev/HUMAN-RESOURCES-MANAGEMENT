import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KeyRound, Palette, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader, StatusBadge } from "../../components/common/ui.jsx";
import { CardSkeleton } from "../../components/feedback.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
    jobTitle: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.me(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  const departmentName = departments.find((dept) => dept.id === profile?.departmentId)?.name;

  // Initialize edit form with current profile data when profile loads or editing starts
  const initializeEditForm = () => {
    if (profile) {
      setEditForm({
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        emergencyContact: profile?.emergencyContact ?? "",
        jobTitle: profile?.jobTitle ?? ""
      });
    }
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => profileService.update(payload),
    onSuccess: () => {
      setIsEditing(false);
      // Refetch profile to get updated data
      // In a real app, you might invalidate the profile query here
    },
    onError: (error) => {
      console.error("Update failed:", error);
      // In a real app, you'd show an error toast/notification
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    updateMutation.mutate(editForm);
  };

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your employee identity, preferences, and account security."
      />

      <section className="flex items-center gap-4 p-5 border border-border rounded-xl bg-card shadow-sm">
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <>
            <AvatarGradient className="h-16 w-16 text-xl shrink-0" name={`${profile?.firstName} ${profile?.lastName}`}>
              {(profile?.firstName ?? "?").charAt(0).toUpperCase()}
            </AvatarGradient>
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

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start mt-6">
        <nav className="border border-border rounded-xl p-1.5 bg-card" aria-label="Profile sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 w-full px-3 py-2 text-start ${
                activeTab === id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              type="button"
              onClick={() => {
                setActiveTab(id);
                if (id === "personal") {
                  initializeEditForm();
                }
              }}
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
                  <h2 className="text-base font-semibold text-foreground">Account details</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Your personal information and workspace access.</p>
                </div>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</span>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-muted p-2 bg-background"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-muted p-2 bg-background"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency Contact</span>
                        <input
                          type="text"
                          value={editForm.emergencyContact}
                          onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-muted p-2 bg-background"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Title</span>
                        <input
                          type="text"
                          value={editForm.jobTitle}
                          onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-muted p-2 bg-background"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          initializeEditForm();
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        type="submit"
                        disabled={isSaving}
                        className="ml-2"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ProfileField label="Email">{profile?.email ?? "—"}</ProfileField>
                    <ProfileField label="Role">{profile?.role ?? "—"}</ProfileField>
                    <ProfileField label="Status">
                      {profile?.status ? <StatusBadge status={profile.status} /> : "—"}
                    </ProfileField>
                    <ProfileField label="Job Title">{profile?.jobTitle ?? "—"}</ProfileField>
                    <ProfileField label="Department">{departmentName ?? "—"}</ProfileField>
                    <ProfileField label="Phone">{profile?.phone ?? "—"}</ProfileField>
                    <ProfileField label="Hire Date">
                      {profile?.dateOfHire
                        ? new Date(profile.dateOfHire).toLocaleDateString()
                        : "—"}
                    </ProfileField>
                    <ProfileField label="Address">{profile?.address ?? "—"}</ProfileField>
                    <ProfileField label="Emergency Contact">{profile?.emergencyContact ?? "—"}</ProfileField>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true);
                        initializeEditForm();
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "password" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Change password</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Keep your account secure by using a strong, unique password.</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  Password resets are sent to your email. Use the reset flow below to set a new
                  password.
                </p>
                <Link className="mt-4 inline-block" to="/forgot-password">
                  <Button variant="outline">Reset password</Button>
                </Link>
              </div>
            </>
          )}

          {activeTab === "appearance" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Appearance</h2>
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
            </>
          )}

          {activeTab === "security" && (
            <>
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Security</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Session and workspace information.</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ProfileField label="Signed in as">{profile?.email ?? "—"}</ProfileField>
                  <ProfileField label="Role">{profile?.role ?? "—"}</ProfileField>
                  <ProfileField label="Workspace">{profile?.company?.name ?? "—"}</ProfileField>
                  <ProfileField label="Theme preference">
                    <span className="text-sm text-muted-foreground">Stored locally on this device.</span>
                  </ProfileField>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function ProfileField({ label, children }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Palette, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "../../components/common/ui.jsx";
import { CardSkeleton } from "../../components/feedback.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
import { usePageTitle } from "../../hooks.js";
import { departmentService, profileService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { PersonalTab } from "./PersonalTab.jsx";
import { PasswordTab } from "./PasswordTab.jsx";
import { AppearanceTab } from "./AppearanceTab.jsx";
import { SecurityTab } from "./SecurityTab.jsx";

const tabs = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "password", label: "Change Password", icon: KeyRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
];

/**
 * Profile page — sidebar navigation + tab content.
 * Each tab is a separate component in the same directory.
 */
export function ProfilePage() {
  usePageTitle("Profile");
  const [activeTab, setActiveTab] = useState("personal");

  const { data: profile = null, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.me(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  return (
    <>
      <PageHeader title="Profile" description="Your employee identity, preferences, and account security." />

      {/* Avatar summary card */}
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

      {/* Tab navigation + content */}
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
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} className="mr-2" /> {label}
            </button>
          ))}
        </nav>

        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {activeTab === "personal" && <PersonalTab profile={profile} departments={departments} isLoading={isLoading} />}
          {activeTab === "password" && <PasswordTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "security" && <SecurityTab profile={profile} />}
        </section>
      </div>
    </>
  );
}

import { ProfileField } from "./ProfileField.jsx";

/**
 * Security tab — read-only display of session and workspace info.
 */
export function SecurityTab({ profile }) {
  return (
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
  );
}

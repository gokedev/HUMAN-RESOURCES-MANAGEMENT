import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { StatusBadge } from "../../components/common/ui.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useToast } from "../../contexts.jsx";
import { profileService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage } from "../../utils.js";
import { ProfileField } from "./ProfileField.jsx";

/**
 * Personal information tab — displays and edits profile fields.
 * Includes the avatar header and the profile edit form.
 */
export function PersonalTab({ profile, departments, isLoading }) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", address: "", emergencyContact: "", jobTitle: "" });

  const departmentName = departments.find(dept => dept.id === profile?.departmentId)?.name;

  const updateMutation = useMutation({
    mutationFn: (payload) => profileService.update(payload),
    onSuccess: () => {
      setIsEditing(false);
      notify({ title: "Profile updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
    onError: (error) => notify({ title: "Update failed", message: getErrorMessage(error), variant: "danger" }),
  });

  /** Populates the edit form with current profile data. */
  const initializeEditForm = () => {
    if (profile) {
      setEditForm({
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        emergencyContact: profile.emergencyContact ?? "",
        jobTitle: profile.jobTitle ?? "",
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    updateMutation.mutate(editForm);
  };

  return (
    <>
      {/* Avatar header */}
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
                <input type="tel" value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isSaving} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
                <input type="text" value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isSaving} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency Contact</span>
                <input type="text" value={editForm.emergencyContact}
                  onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isSaving} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Title</span>
                <input type="text" value={editForm.jobTitle}
                  onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isSaving} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => { setIsEditing(false); initializeEditForm(); }} disabled={isSaving}>Cancel</Button>
              <Button variant="default" type="submit" disabled={isSaving} className="ml-2">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ProfileField label="Email">{profile?.email ?? "—"}</ProfileField>
            <ProfileField label="Role">{profile?.role ?? "—"}</ProfileField>
            <ProfileField label="Status">{profile?.status ? <StatusBadge status={profile.status} /> : "—"}</ProfileField>
            <ProfileField label="Job Title" showEditIcon={!isEditing}>{profile?.jobTitle ?? "—"}</ProfileField>
            <ProfileField label="Department">{departmentName ?? "—"}</ProfileField>
            <ProfileField label="Phone" showEditIcon={!isEditing}>{profile?.phone ?? "—"}</ProfileField>
            <ProfileField label="Hire Date">{profile?.dateOfHire ? new Date(profile.dateOfHire).toLocaleDateString() : "—"}</ProfileField>
            <ProfileField label="Address" showEditIcon={!isEditing}>{profile?.address ?? "—"}</ProfileField>
            <ProfileField label="Emergency Contact" showEditIcon={!isEditing}>{profile?.emergencyContact ?? "—"}</ProfileField>
          </div>
        )}
        {!isEditing && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => { setIsEditing(true); initializeEditForm(); }}>Edit Profile</Button>
          </div>
        )}
      </div>
    </>
  );
}

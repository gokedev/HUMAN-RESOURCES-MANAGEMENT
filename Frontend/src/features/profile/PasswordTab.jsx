import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../components/ui/button.jsx";
import { useToast } from "../../contexts.jsx";
import { authService } from "../../api/index.js";
import { getErrorMessage } from "../../utils.js";

/**
 * Change password tab — form for updating the current password.
 * Validates that new + confirm passwords match before submitting.
 */
export function PasswordTab() {
  const { notify } = useToast();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  const updatePasswordMutation = useMutation({
    mutationFn: (payload) => authService.updatePassword(payload),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordUpdating(false);
      notify({ title: "Password updated", variant: "success" });
    },
    onError: (error) => notify({ title: "Update failed", message: getErrorMessage(error), variant: "danger" }),
  });

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setIsPasswordUpdating(true);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify({ title: "Passwords do not match", variant: "danger" });
      setIsPasswordUpdating(false);
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">Change password</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Keep your account secure by using a strong, unique password.</p>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Password</span>
            <input type="password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isPasswordUpdating} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Password</span>
            <input type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isPasswordUpdating} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm New Password</span>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-muted p-2 bg-background" disabled={isPasswordUpdating} />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })} disabled={isPasswordUpdating}>Cancel</Button>
            <Button variant="default" type="submit" disabled={isPasswordUpdating} className="ml-2">
              {isPasswordUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">If you don't remember your current password, you can reset it using the link below.</p>
        <Link className="mt-2 inline-block" to="/forgot-password">
          <Button variant="outline">Reset password</Button>
        </Link>
      </div>
    </>
  );
}

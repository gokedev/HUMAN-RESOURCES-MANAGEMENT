import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../contexts.jsx";
import { usePageTitle } from "../../hooks.js";
import { authService } from "../../api/index.js";
import { getErrorMessage } from "../../utils.js";
import {
  acceptInvitationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { PasswordInput } from "@/components/ui/password-input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

export function ForgotPasswordPage() {
  usePageTitle("Forgot Password");
  const { notify } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      companySlug: "",
    },
  });
  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(values);
      // The API always returns 200 to avoid revealing which emails are registered.
      setSent(true);
    } catch (error) {
      notify(getErrorMessage(error), "danger");
    } finally {
      setIsSubmitting(false);
    }
  }
  if (sent) {
    return (
      <div className="w-full max-w-[440px]">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Check your inbox</span>
        <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Reset link sent</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          If an account exists for that email, a password reset link has been
          sent. It expires in one hour.
        </p>
        <Button asChild className="w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="w-full max-w-[440px]">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">Account recovery</span>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Reset your password</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySlug">Company slug</Label>
          <Input id="companySlug" type="text" {...register("companySlug")} placeholder="e.g. acme-inc" className={errors.companySlug ? "border-destructive" : ""} />
          {errors.companySlug && <p className="text-xs text-destructive">{errors.companySlug.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
          Send reset link
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="text-sm text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}

export function ResetPasswordPage() {
  usePageTitle("Reset Password");
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setValue("token", token);
    }
  }, [searchParams, setValue]);
  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      await authService.resetPassword(values);
      notify({ title: "Password updated", message: "Sign in with your new password.", variant: "success" });
      navigate("/login", { replace: true });
    } catch (error) {
      notify({ title: "Reset failed", message: getErrorMessage(error), variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="w-full max-w-[440px]">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">New credentials</span>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Choose a new password</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" type="text" {...register("token")} className={errors.token ? "border-destructive" : ""} />
          {errors.token && <p className="text-xs text-destructive">{errors.token.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            {...register("newPassword")}
            className={errors.newPassword ? "border-destructive" : ""}
          />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          {!errors.newPassword && <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase, digit, and special character (@$!%*?&amp;#).</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
          Update password
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Back to <Link to="/login" className="text-sm text-primary hover:underline font-medium">sign in</Link>
      </p>
    </div>
  );
}

export function AcceptInvitationPage() {
  usePageTitle("Accept Invitation");
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      token: "",
      password: "",
    },
  });
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setValue("token", token);
    }
  }, [searchParams, setValue]);
  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      await authService.acceptInvitation(values);
      notify({ title: "Password set", message: "You can now sign in.", variant: "success" });
      navigate("/login", { replace: true });
    } catch (error) {
      notify({ title: "Invitation failed", message: getErrorMessage(error), variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="w-full max-w-[440px]">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">Accept invitation</span>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Set your password</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="token">Invitation token</Label>
          <Input id="token" type="text" {...register("token")} className={errors.token ? "border-destructive" : ""} />
          {errors.token && <p className="text-xs text-destructive">{errors.token.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" {...register("password")} className={errors.password ? "border-destructive" : ""} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          {!errors.password && <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase, digit, and special character (@$!%*?&amp;#).</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
          Set password
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-sm text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts.jsx";
import { usePageTitle } from "../../hooks.js";
import { loginSchema } from "./schemas.js";
import { getErrorMessage, tokenStorage } from "../../utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { PasswordInput } from "@/components/ui/password-input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { AlertTriangle } from "lucide-react";

export function LoginPage() {
  usePageTitle("Login");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(state?.from?.pathname ?? "/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, state]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", companySlug: "", rememberMe: true },
  });

  async function onSubmit(values) {
    setServerError("");
    try {
      await login(
        { email: values.email, password: values.password, companySlug: values.companySlug },
        values.rememberMe,
      );
      navigate("/dashboard", { replace: true });
    } catch (error) {
      tokenStorage.clear();
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">Secure access</span>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Sign in to your workspace</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" {...register("password")} className={errors.password ? "border-destructive" : ""} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySlug">Company slug</Label>
          <Input id="companySlug" type="text" {...register("companySlug")} placeholder="e.g. acme-inc" className={errors.companySlug ? "border-destructive" : ""} />
          {errors.companySlug && <p className="text-xs text-destructive">{errors.companySlug.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("rememberMe")} className="accent-primary" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
        </div>
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New company? <Link to="/register-company" className="text-primary hover:underline font-medium">Create workspace</Link>
      </p>
    </div>
  );
}

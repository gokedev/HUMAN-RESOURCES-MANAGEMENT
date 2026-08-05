import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useToast } from "../../contexts.jsx";
import { usePageTitle } from "../../hooks.js";
import { loginSchema } from "./schemas.js";
import { getErrorMessage, tokenStorage } from "../../utils.js";

export function LoginPage() {
  usePageTitle("Login");
  const { login, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  // Already signed in? Go straight to the dashboard (or the page they tried to open).
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
    defaultValues: {
      email: "",
      password: "",
      companySlug: "",
      rememberMe: true,
    },
  });
  async function onSubmit(values) {
    try {
      await login(
        {
          email: values.email,
          password: values.password,
          companySlug: values.companySlug,
        },
        values.rememberMe,
      );
      navigate("/dashboard", { replace: true });
    } catch (error) {
      tokenStorage.clear();
      notify(getErrorMessage(error), "danger");
    }
  }
  return (
    <div className="auth-card">
      <span className="page-eyebrow">Secure access</span>
      <h2>Sign in to your workspace</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Email
          <input
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            type="email"
            {...register("email")}
          />
          {errors.email ? (
            <span className="invalid-feedback">{errors.email.message}</span>
          ) : null}
        </label>
        <label className="form-label">
          Password
          <input
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            type="password"
            {...register("password")}
          />
          {errors.password ? (
            <span className="invalid-feedback">{errors.password.message}</span>
          ) : null}
        </label>
        <label className="form-label">
          Company slug
          <input
            className={`form-control ${errors.companySlug ? "is-invalid" : ""}`}
            type="text"
            {...register("companySlug")}
            placeholder="e.g. acme-inc"
          />
          {errors.companySlug ? (
            <span className="invalid-feedback">{errors.companySlug.message}</span>
          ) : null}
        </label>
        <div className="form-row">
          <label className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              {...register("rememberMe")}
            />
            <span className="form-check-label">Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button className="btn btn-primary w-100" type="submit">
          Sign in
        </button>
      </form>
      <p className="auth-link">
        New company? <Link to="/register-company">Create workspace</Link>
      </p>
    </div>
  );
}

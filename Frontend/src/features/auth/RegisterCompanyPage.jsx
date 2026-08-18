import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useToast } from "../../contexts.jsx";
import { usePageTitle } from "../../hooks.js";
import { registerCompanySchema } from "./schemas.js";
import { getErrorMessage } from "../../utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { PasswordInput } from "@/components/ui/password-input.jsx";
import { Label } from "@/components/ui/label.jsx";

const optionalText = (value) => (value?.trim() ? value.trim() : undefined);

export function RegisterCompanyPage() {
  usePageTitle("Register Company");
  const { registerCompany, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: "",
      industry: "",
      country: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });
  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      await registerCompany({
        companyName: values.companyName,
        industry: optionalText(values.industry),
        country: optionalText(values.country),
        adminFirstName: values.adminFirstName,
        adminLastName: values.adminLastName,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
      });
      notify({ title: "Workspace created", message: "Welcome to CoralHR!", variant: "success" });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify({ title: "Registration failed", message: getErrorMessage(error), variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="w-full max-w-[440px]">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">Company setup</span>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold text-foreground">Create your workspace</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Company name *</Label>
            <Input
              type="text"
              {...register("companyName")}
              className={errors.companyName ? "border-destructive" : ""}
            />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input type="text" {...register("industry")} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input type="text" {...register("country")} />
          </div>
          <div className="space-y-2">
            <Label>Admin first name *</Label>
            <Input
              type="text"
              {...register("adminFirstName")}
              className={errors.adminFirstName ? "border-destructive" : ""}
            />
            {errors.adminFirstName && <p className="text-xs text-destructive">{errors.adminFirstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Admin last name *</Label>
            <Input
              type="text"
              {...register("adminLastName")}
              className={errors.adminLastName ? "border-destructive" : ""}
            />
            {errors.adminLastName && <p className="text-xs text-destructive">{errors.adminLastName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Admin email *</Label>
            <Input
              type="email"
              {...register("adminEmail")}
              className={errors.adminEmail ? "border-destructive" : ""}
            />
            {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Admin password *</Label>
            <PasswordInput
              {...register("adminPassword")}
              className={errors.adminPassword ? "border-destructive" : ""}
            />
            {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword.message}</p>}
            {!errors.adminPassword && <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase, digit, and special character (@$!%*?&amp;#).</p>}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
          Create workspace
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already registered? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Select } from "@/components/ui/select.jsx";

const baseSchema = {
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  dateOfHire: z.string().optional(),
};

export const createEmployeeSchema = z.object({
  email: z.email("Enter a valid email address."),
  ...baseSchema,
});

export const editEmployeeSchema = z.object(baseSchema);

export function EmployeeForm({ departments = [], initialValues, submitLabel, isSubmitting, onSubmit }) {
  const schema = initialValues?.email !== undefined ? editEmployeeSchema : createEmployeeSchema;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      jobTitle: "",
      departmentId: "",
      dateOfHire: "",
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        email: initialValues.email ?? "",
        firstName: initialValues.firstName ?? "",
        lastName: initialValues.lastName ?? "",
        phone: initialValues.phone ?? "",
        jobTitle: initialValues.jobTitle ?? "",
        departmentId: initialValues.departmentId ?? "",
        dateOfHire: initialValues.dateOfHire ?? "",
      });
    }
  }, [initialValues, reset]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>First name *</Label>
          <Input
            className={errors.firstName ? "border-destructive" : ""}
            type="text"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Last name *</Label>
          <Input
            className={errors.lastName ? "border-destructive" : ""}
            type="text"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      {initialValues?.email === undefined && (
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input
            className={errors.email ? "border-destructive" : ""}
            type="email"
            {...register("email")}
            placeholder="employee@company.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input type="tel" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label>Job title</Label>
          <Input type="text" {...register("jobTitle")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Select {...register("departmentId")}>
          <option value="">Select department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Date of hire</Label>
        <Input type="date" {...register("dateOfHire")} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

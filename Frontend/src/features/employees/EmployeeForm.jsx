import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

// Shared create/edit employee form used by the new and edit pages.
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
    <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <label className="form-label">
          First name *
          <input
            className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
            type="text"
            {...register("firstName")}
          />
          {errors.firstName ? (
            <span className="invalid-feedback">{errors.firstName.message}</span>
          ) : null}
        </label>
        <label className="form-label">
          Last name *
          <input
            className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
            type="text"
            {...register("lastName")}
          />
          {errors.lastName ? (
            <span className="invalid-feedback">{errors.lastName.message}</span>
          ) : null}
        </label>
      </div>
      {initialValues?.email === undefined && (
        <label className="form-label">
          Email *
          <input
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            type="email"
            {...register("email")}
            placeholder="employee@company.com"
          />
          {errors.email ? (
            <span className="invalid-feedback">{errors.email.message}</span>
          ) : null}
        </label>
      )}
      <div className="form-grid">
        <label className="form-label">
          Phone
          <input className="form-control" type="tel" {...register("phone")} />
        </label>
        <label className="form-label">
          Job title
          <input className="form-control" type="text" {...register("jobTitle")} />
        </label>
      </div>
      <label className="form-label">
        Department
        <select className="form-control" {...register("departmentId")}>
          <option value="">Select department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Date of hire
        <input className="form-control" type="date" {...register("dateOfHire")} />
      </label>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

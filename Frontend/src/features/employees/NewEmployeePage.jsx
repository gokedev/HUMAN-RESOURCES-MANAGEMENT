import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/common/ui.jsx";
import { TableSkeleton } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { EmployeeForm } from "./EmployeeForm.jsx";

export function NewEmployeePage() {
  usePageTitle("Add Employee");
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: departments, isLoading } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const createMutation = useMutation({
    mutationFn: (payload) => employeeService.create(payload),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({
        title: "Employee invited",
        message: "They will receive an email to set their password.",
        variant: "success",
      });
      navigate("/employees", { replace: true });
    },
    onError: (error) => notify({ title: "Invite failed", message: getErrorMessage(error), variant: "danger" }),
  });

  function buildPayload(values) {
    const payload = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
    };
    if (values.phone) payload.phone = values.phone;
    if (values.jobTitle) payload.jobTitle = values.jobTitle;
    if (values.departmentId) payload.departmentId = values.departmentId;
    if (values.dateOfHire) payload.dateOfHire = values.dateOfHire;
    return payload;
  }

  return (
    <>
      <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <PageHeader
        title="Add employee"
        description="Create a new employee record. An invitation email with a set-password link is sent automatically."
      />
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Employee details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Basic profile fields. Email cannot be changed later.</p>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <EmployeeForm
              departments={departments}
              submitLabel="Send invitation"
              isSubmitting={createMutation.isPending}
              onSubmit={(values) => createMutation.mutate(buildPayload(values))}
            />
          )}
        </div>
      </section>
    </>
  );
}

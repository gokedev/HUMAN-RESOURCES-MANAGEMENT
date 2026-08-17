import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserX } from "lucide-react";
import { PageHeader } from "../../components/common/ui.jsx";
import { CardSkeleton, EmptyState } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { EmployeeForm } from "./EmployeeForm.jsx";

export function EditEmployeePage() {
  usePageTitle("Edit Employee");
  const { id } = useParams();
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const { data: employee, isLoading, isError } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.get(id),
  });
  const updateMutation = useMutation({
    mutationFn: (payload) => employeeService.update(id, payload),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify("Employee updated.", "success");
      navigate(`/employees/${id}`, { replace: true });
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });

  function buildPayload(values) {
    const payload = {
      email: employee.email,
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
      <Link to={`/employees/${id}`} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3">
        <ArrowLeft size={15} /> Back to employee
      </Link>
      <PageHeader
        title="Edit employee"
        description="Update profile fields. Email cannot be changed on this screen."
      />
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Employee details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Save changes to update this person's record.</p>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <CardSkeleton />
          ) : isError || !employee ? (
            <EmptyState
              icon={UserX}
              title="Employee not found"
              description="This employee may have been removed from your company."
            />
          ) : (
            <EmployeeForm
              departments={departments}
              initialValues={employee}
              submitLabel="Save changes"
              isSubmitting={updateMutation.isPending}
              onSubmit={(values) => updateMutation.mutate(buildPayload(values))}
            />
          )}
        </div>
      </section>
    </>
  );
}

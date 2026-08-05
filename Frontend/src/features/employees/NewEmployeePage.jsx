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
      notify("Employee invited. They will receive an email to set their password.", "success");
      navigate("/employees", { replace: true });
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
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
      <Link to="/employees" className="back-link">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <PageHeader
        title="Add employee"
        description="Create a new employee record. An invitation email with a set-password link is sent automatically."
      />
      <section className="table-shell">
        <div className="table-shell-header">
          <div>
            <h2>Employee details</h2>
            <p>Basic profile fields. Email cannot be changed later.</p>
          </div>
        </div>
        <div style={{ padding: "1.5rem" }}>
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

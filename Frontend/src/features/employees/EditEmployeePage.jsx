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
      <Link to={`/employees/${id}`} className="back-link">
        <ArrowLeft size={15} /> Back to employee
      </Link>
      <PageHeader
        title="Edit employee"
        description="Update profile fields. Email cannot be changed on this screen."
      />
      <section className="table-shell">
        <div className="table-shell-header">
          <div>
            <h2>Employee details</h2>
            <p>Save changes to update this person's record.</p>
          </div>
        </div>
        <div style={{ padding: "1.5rem" }}>
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

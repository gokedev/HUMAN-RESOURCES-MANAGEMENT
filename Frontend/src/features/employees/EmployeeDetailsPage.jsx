import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, UserX, UserCheck } from "lucide-react";
import { ConfirmDialog, PageHeader, StatusBadge } from "../../components/common/ui.jsx";
import { CardSkeleton, EmptyState } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";

export function EmployeeDetailsPage() {
  usePageTitle("Employee Details");
  const { id } = useParams();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const { data: employees, isLoading } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const deactivateMutation = useMutation({
    mutationFn: () => employeeService.deactivate(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify("Employee deactivated.", "success");
      setShowDeactivate(false);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });
  const reactivateMutation = useMutation({
    mutationFn: () => employeeService.reactivate(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify("Employee reactivated.", "success");
      setShowReactivate(false);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });

  const employee = employees?.find((emp) => emp.id === id) ?? null;
  const departmentName = departments?.find((dept) => dept.id === employee?.departmentId)?.name;
  const managerName = employee?.managerId
    ? employees?.find((emp) => emp.id === employee.managerId)
    : null;

  if (isLoading) {
    return (
      <>
        <Link to="/employees" className="back-link">
          <ArrowLeft size={15} /> Back to employees
        </Link>
        <PageHeader title="Employee details" description="Loading..." />
        <CardSkeleton />
      </>
    );
  }

  if (!employee) {
    return (
      <>
        <Link to="/employees" className="back-link">
          <ArrowLeft size={15} /> Back to employees
        </Link>
        <EmptyState
          icon={UserX}
          title="Employee not found"
          description="This employee may have been removed from your company."
        />
      </>
    );
  }

  return (
    <>
      <Link to="/employees" className="back-link">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.email}
        actions={
          <div className="detail-actions">
            <Link className="btn btn-outline-secondary" to={`/employees/${employee.id}/edit`}>
              <Pencil size={16} style={{ marginRight: "0.35rem" }} /> Edit
            </Link>
            {employee.status === "ACTIVE" ? (
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => setShowDeactivate(true)}
              >
                <UserX size={16} style={{ marginRight: "0.35rem" }} /> Deactivate
              </button>
            ) : employee.status === "SUSPENDED" ? (
              <button
                className="btn btn-outline-success"
                type="button"
                onClick={() => setShowReactivate(true)}
              >
                <UserCheck size={16} style={{ marginRight: "0.35rem" }} /> Reactivate
              </button>
            ) : null}
          </div>
        }
      />
      <section className="table-shell">
        <div className="table-shell-header">
          <div>
            <h2>Employee record</h2>
            <p>Profile information and workspace access.</p>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <section className="profile-panel" style={{ alignItems: "flex-start", marginBottom: "1rem" }}>
            <span className="profile-avatar profile-avatar-lg">
              {employee.firstName.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2>
                {employee.firstName} {employee.lastName}
              </h2>
              <p>
                {employee.jobTitle ?? "No job title"} · {employee.email}
              </p>
            </div>
          </section>
          <div className="form-grid">
            <div>
              <strong>Status</strong>
              <p>
                <StatusBadge status={employee.status} />
              </p>
            </div>
            <div>
              <strong>Role</strong>
              <p>{employee.role}</p>
            </div>
            <div>
              <strong>Job Title</strong>
              <p>{employee.jobTitle ?? "—"}</p>
            </div>
            <div>
              <strong>Department</strong>
              <p>{departmentName ?? "—"}</p>
            </div>
            <div>
              <strong>Manager</strong>
              <p>{managerName ? `${managerName.firstName} ${managerName.lastName}` : "—"}</p>
            </div>
            <div>
              <strong>Phone</strong>
              <p>{employee.phone ?? "—"}</p>
            </div>
            <div>
              <strong>Hire Date</strong>
              <p>{employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <strong>Created</strong>
              <p>{new Date(employee.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <strong>Last Updated</strong>
              <p>{new Date(employee.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {showDeactivate && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          variant="danger"
          isProcessing={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate()}
          onClose={() => setShowDeactivate(false)}
        />
      )}
      {showReactivate && (
        <ConfirmDialog
          title="Reactivate employee"
          message={`Reactivate ${employee.firstName} ${employee.lastName}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          variant="primary"
          isProcessing={reactivateMutation.isPending}
          onConfirm={() => reactivateMutation.mutate()}
          onClose={() => setShowReactivate(false)}
        />
      )}
    </>
  );
}

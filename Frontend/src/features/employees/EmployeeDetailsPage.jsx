import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
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
        <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3">
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
        <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3">
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
      <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.email}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to={`/employees/${employee.id}/edit`}>
                <Pencil size={16} className="mr-1.5" /> Edit
              </Link>
            </Button>
            {employee.status === "ACTIVE" ? (
              <Button
                variant="destructive"
                type="button"
                onClick={() => setShowDeactivate(true)}
              >
                <UserX size={16} className="mr-1.5" /> Deactivate
              </Button>
            ) : employee.status === "SUSPENDED" ? (
              <Button
                variant="default"
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowReactivate(true)}
              >
                <UserCheck size={16} className="mr-1.5" /> Reactivate
              </Button>
            ) : null}
          </div>
        }
      />
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Employee record</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Profile information and workspace access.</p>
          </div>
        </div>
        <div className="p-5">
          <section className="flex items-start gap-4 mb-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-strong text-white text-xl font-bold shrink-0">
              {employee.firstName.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-xl font-semibold">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-muted-foreground">
                {employee.jobTitle ?? "No job title"} · {employee.email}
              </p>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-sm font-medium">Status</strong>
              <p className="mt-1">
                <StatusBadge status={employee.status} />
              </p>
            </div>
            <div>
              <strong className="text-sm font-medium">Role</strong>
              <p className="mt-1">{employee.role}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Job Title</strong>
              <p className="mt-1">{employee.jobTitle ?? "—"}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Department</strong>
              <p className="mt-1">{departmentName ?? "—"}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Manager</strong>
              <p className="mt-1">{managerName ? `${managerName.firstName} ${managerName.lastName}` : "—"}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Phone</strong>
              <p className="mt-1">{employee.phone ?? "—"}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Hire Date</strong>
              <p className="mt-1">{employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Created</strong>
              <p className="mt-1">{new Date(employee.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <strong className="text-sm font-medium">Last Updated</strong>
              <p className="mt-1">{new Date(employee.updatedAt).toLocaleString()}</p>
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

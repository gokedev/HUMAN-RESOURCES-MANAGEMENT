import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { ConfirmDialog, PageHeader, StatusBadge } from "../../components/common/ui.jsx";
import { CardSkeleton, EmptyState } from "../../components/feedback.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";

export function EmployeeDetailsPage() {
  usePageTitle("Employee Details");
  const { id } = useParams();
  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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
      notify({ title: "Employee deactivated", message: "They can no longer log in.", variant: "success" });
      setShowDeactivate(false);
    },
    onError: (error) => notify({ title: "Action failed", message: getErrorMessage(error), variant: "danger" }),
  });
  const reactivateMutation = useMutation({
    mutationFn: () => employeeService.reactivate(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({ title: "Employee reactivated", message: "They can log in again.", variant: "success" });
      setShowReactivate(false);
    },
    onError: (error) => notify({ title: "Action failed", message: getErrorMessage(error), variant: "danger" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => employeeService.delete(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({ title: "Employee deleted", variant: "success" });
      navigate("/employees");
    },
    onError: (error) => notify({ title: "Delete failed", message: getErrorMessage(error), variant: "danger" }),
  });

  const employee = employees?.find((emp) => emp.id === id) ?? null;
  const departmentName = departments?.find((dept) => dept.id === employee?.departmentId)?.name;
  const managerName = employee?.managerId
    ? employees?.find((emp) => emp.id === employee.managerId)
    : null;

  if (isLoading) {
    return (
      <>
        <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3 transition-colors duration-150">
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
        <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3 transition-colors duration-150">
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
      <Link to="/employees" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium no-underline hover:text-primary mb-3 transition-colors duration-150">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.email}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to={`/employees/${employee.id}/edit`}>
                <Pencil size={16} /> Edit
              </Link>
            </Button>
            {employee.status === "ACTIVE" ? (
              <Button variant="destructive" type="button" onClick={() => setShowDeactivate(true)}>
                <UserX size={16} /> Deactivate
              </Button>
            ) : employee.status === "SUSPENDED" ? (
              <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowReactivate(true)}>
                <UserCheck size={16} /> Reactivate
              </Button>
            ) : null}
            <Button variant="destructive" type="button" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        }
      />
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Employee record</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Profile information and workspace access.</p>
          </div>
        </div>
        <div className="p-6">
          <section className="flex items-start gap-4 mb-6">
            <AvatarGradient className="h-16 w-16 text-xl shrink-0" name={`${employee.firstName} ${employee.lastName}`}>
              {employee.firstName.charAt(0).toUpperCase()}
            </AvatarGradient>
            <div>
              <h2 className="text-xl font-semibold">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {employee.jobTitle ?? "No job title"} · {employee.email}
              </p>
            </div>
          </section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <DetailField label="Status">
              <StatusBadge status={employee.status} />
            </DetailField>
            <DetailField label="Role">{employee.role}</DetailField>
            <DetailField label="Job Title">{employee.jobTitle ?? "—"}</DetailField>
            <DetailField label="Department">{departmentName ?? "—"}</DetailField>
            <DetailField label="Manager">
              {managerName ? `${managerName.firstName} ${managerName.lastName}` : "—"}
            </DetailField>
            <DetailField label="Phone">{employee.phone ?? "—"}</DetailField>
            <DetailField label="Hire Date">
              {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "—"}
            </DetailField>
            <DetailField label="Created">
              {new Date(employee.createdAt).toLocaleString()}
            </DetailField>
            <DetailField label="Last Updated">
              {new Date(employee.updatedAt).toLocaleString()}
            </DetailField>
          </div>
        </div>
      </section>

      {showDeactivate && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          variant="destructive"
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
          variant="default"
          isProcessing={reactivateMutation.isPending}
          onConfirm={() => reactivateMutation.mutate()}
          onClose={() => setShowReactivate(false)}
        />
      )}
      {showDelete && (
        <ConfirmDialog
          title="Delete employee"
          message={`Permanently delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          isProcessing={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

function DetailField({ label, children }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm text-foreground">{children}</p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2, UserCheck, UserX, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  ConfirmDialog,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
} from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";

const PAGE_SIZE = 10;

export function EmployeesPage() {
  usePageTitle("Employees");
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const departmentNameMap = useMemo(() => {
    if (!Array.isArray(departments)) {
      console.error('Departments is not an array:', departments);
      return {};
    }
    return Object.fromEntries(departments.map((dept) => [dept.id, dept.name]));
  }, [departments]);

  const statusMutation = useMutation({
    mutationFn: ({ id, deactivate }) =>
      deactivate ? employeeService.deactivate(id) : employeeService.reactivate(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({
        title: pendingAction?.deactivate ? "Employee deactivated" : "Employee reactivated",
        variant: "success",
      });
      setPendingAction(null);
    },
    onError: (error) => notify({ title: "Action failed", message: getErrorMessage(error), variant: "danger" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.delete(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({ title: "Employee deleted", variant: "success" });
      setDeleteTarget(null);
    },
    onError: (error) => notify({ title: "Delete failed", message: getErrorMessage(error), variant: "danger" }),
  });

  const resendInvitationMutation = useMutation({
    mutationFn: (id) => employeeService.resendInvitation(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({ title: "Invitation resent", variant: "success" });
    },
    onError: (error) => notify({ title: "Failed to resend invitation", message: getErrorMessage(error), variant: "danger" }),
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (id) => employeeService.revokeInvitation(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify({ title: "Invitation revoked", variant: "success" });
    },
    onError: (error) => notify({ title: "Failed to revoke invitation", message: getErrorMessage(error), variant: "danger" }),
  });

  // Defensive check to prevent "filter is not a function" errors
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    // Ensure employees is an array before calling filter
    if (!Array.isArray(employees)) {
      console.error('Employees is not an array:', employees);
      return [];
    }

    return employees.filter((emp) => {
      if (departmentFilter && emp.departmentId !== departmentFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;
      if (!term) return true;
      return (
        emp.firstName.toLowerCase().includes(term) ||
        emp.lastName.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        (emp.jobTitle ?? "").toLowerCase().includes(term)
      );
    });
  }, [employees, search, departmentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage workforce records, invitations, reporting lines, and account status."
        actions={
          <Button asChild>
            <Link to="/employees/new">
              <Plus size={16} /> Add employee
            </Link>
          </Button>
        }
      />
      <DataTableShell
        title="Employee directory"
        description={`${filtered.length} employee${filtered.length === 1 ? "" : "s"} total`}
        action={
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => { setSearch(""); setDepartmentFilter(""); setStatusFilter(""); setCurrentPage(0); }}
          >
            Clear filters
          </Button>
        }
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(0);
            }}
            placeholder="Search name, email, or job title..."
          />
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="">All departments</option>
            {!Array.isArray(departments) ? null : departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <EmptyState
            icon={Users}
            title="Could not load employees"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })}
          />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered.length === 0 ? "No employees found" : "No matches"}
            description={
              filtered.length === 0
                ? "Add your first employee to get started."
                : "Try adjusting your search or filters."
            }
            actionLabel={filtered.length === 0 ? "Add employee" : undefined}
            onAction={filtered.length === 0 ? () => window.location.href = "/employees/new" : undefined}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="h-10 px-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                  <th className="h-10 px-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="h-10 px-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Job Title</th>
                  <th className="h-10 px-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="h-10 px-4 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-muted/50 transition-colors last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <AvatarGradient className="h-9 w-9 text-xs shrink-0" name={`${emp.firstName} ${emp.lastName}`}>
                          {emp.firstName.charAt(0).toUpperCase()}
                        </AvatarGradient>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{emp.email}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">{departmentNameMap[emp.departmentId] ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">{departmentNameMap[emp.departmentId] ?? "—"}</td>
                    <td className="p-4 hidden md:table-cell">{emp.jobTitle ?? "—"}</td>
                    <td className="p-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/employees/${emp.id}`} title="View details">
                            <Eye size={16} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/employees/${emp.id}/edit`} title="Edit">
                            <Pencil size={16} />
                          </Link>
                        </Button>
                        {emp.status === "PENDING" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Resend invitation"
                              onClick={() => resendInvitationMutation.mutate(emp.id)}
                            >
                              <RefreshCw size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                              title="Revoke invitation"
                              onClick={() => revokeInvitationMutation.mutate(emp.id)}
                            >
                              <UserX size={16} />
                            </Button>
                          </>
                        ) : emp.status === "ACTIVE" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            type="button"
                            title="Deactivate"
                            onClick={() => setPendingAction({ id: emp.id, deactivate: true })}
                          >
                            <UserX size={16} />
                          </Button>
                        ) : emp.status === "SUSPENDED" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            type="button"
                            title="Reactivate"
                            onClick={() => setPendingAction({ id: emp.id, deactivate: false })}
                          >
                            <UserCheck size={16} />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget(emp)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalElements={filtered.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </DataTableShell>

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.deactivate ? "Deactivate employee" : "Reactivate employee"}
          message={
            pendingAction.deactivate
              ? "Deactivate this employee? They will no longer be able to log in."
              : "Reactivate this employee? They will be able to log in again."
          }
          confirmLabel={pendingAction.deactivate ? "Deactivate" : "Reactivate"}
          variant={pendingAction.deactivate ? "destructive" : "default"}
          isProcessing={statusMutation.isPending}
          onConfirm={() => statusMutation.mutate(pendingAction)}
          onClose={() => setPendingAction(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete employee"
          message={`Permanently delete ${deleteTarget.firstName} ${deleteTarget.lastName}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          isProcessing={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, UserCheck, UserX, Users } from "lucide-react";
import {
  ConfirmDialog,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
} from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api.js";
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

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const departmentNameMap = useMemo(
    () => Object.fromEntries(departments.map((dept) => [dept.id, dept.name])),
    [departments]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, deactivate }) =>
      deactivate ? employeeService.deactivate(id) : employeeService.reactivate(id),
    onSuccess: async () => {
      await queryInvalidation.afterEmployeeChange(queryClient);
      notify(
        pendingAction?.deactivate ? "Employee deactivated." : "Employee reactivated.",
        "success"
      );
      setPendingAction(null);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
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
          <Link className="btn btn-primary" to="/employees/new">
            <Plus size={16} style={{ marginRight: "0.35rem" }} /> Add employee
          </Link>
        }
      />
      <DataTableShell
        title="Employee directory"
        description="Search, filter, and manage company users."
        action={
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setSearch("")}
          >
            Clear filters
          </button>
        }
      >
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(0);
            }}
            placeholder="Search name, email, or job title..."
          />
          <select
            className="form-control"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="">All departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            className="form-control"
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
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="cell-identity">
                          <span className="profile-avatar">
                            {emp.firstName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>
                              {emp.firstName} {emp.lastName}
                            </strong>
                            <span>{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{departmentNameMap[emp.departmentId] ?? "—"}</td>
                      <td>{emp.jobTitle ?? "—"}</td>
                      <td>
                        <StatusBadge status={emp.status} />
                      </td>
                      <td>{emp.role}</td>
                      <td className="text-end">
                        <div className="row-actions">
                          <Link
                            className="icon-button"
                            to={`/employees/${emp.id}`}
                            title="View details"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            className="icon-button"
                            to={`/employees/${emp.id}/edit`}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </Link>
                          {emp.status === "ACTIVE" ? (
                            <button
                              className="icon-button"
                              type="button"
                              title="Deactivate"
                              onClick={() => setPendingAction({ id: emp.id, deactivate: true })}
                            >
                              <UserX size={16} />
                            </button>
                          ) : emp.status === "SUSPENDED" ? (
                            <button
                              className="icon-button"
                              type="button"
                              title="Reactivate"
                              onClick={() => setPendingAction({ id: emp.id, deactivate: false })}
                            >
                              <UserCheck size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          variant={pendingAction.deactivate ? "danger" : "primary"}
          isProcessing={statusMutation.isPending}
          onConfirm={() => statusMutation.mutate(pendingAction)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </>
  );
}

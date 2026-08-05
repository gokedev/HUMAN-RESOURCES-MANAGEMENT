import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog, PageHeader } from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { departmentService, employeeService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { CreateDepartmentModal } from "./DepartmentModals.jsx";

export function DepartmentsPage() {
  usePageTitle("Departments");
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: departments = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const { data: employees = [] } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const employeeCounts = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      if (emp.departmentId) counts[emp.departmentId] = (counts[emp.departmentId] ?? 0) + 1;
    });
    return counts;
  }, [employees]);

  const createMutation = useMutation({
    mutationFn: (name) => departmentService.create({ name }),
    onSuccess: async () => {
      await queryInvalidation.afterDepartmentChange(queryClient);
      notify("Department created.", "success");
      setShowCreate(false);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => departmentService.delete(id),
    onSuccess: async () => {
      await queryInvalidation.afterDepartmentChange(queryClient);
      notify("Department deleted.", "success");
      setDeleteTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organize people into company teams and reporting areas."
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} style={{ marginRight: "0.35rem" }} /> New department
          </button>
        }
      />
      <DataTableShell
        title="Department list"
        description="All departments in your company."
      >
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <EmptyState
            icon={Building2}
            title="Could not load departments"
            description="Check your connection and try again."
          />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department to start organizing your team."
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>
                        <div className="cell-identity">
                          <span className="profile-avatar">
                            {dept.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{dept.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{employeeCounts[dept.id] ?? 0}</td>
                      <td>{new Date(dept.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            title="Delete department"
                            disabled={deleteMutation.isPending}
                            onClick={() => setDeleteTarget(dept)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pagination-info" style={{ padding: "0.85rem 1rem" }}>
              Members are assigned automatically when employees join a department.
            </p>
          </>
        )}
      </DataTableShell>

      {showCreate && (
        <CreateDepartmentModal
          isSubmitting={createMutation.isPending}
          onCreate={(name) => createMutation.mutate(name)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete department"
          message={`Delete "${deleteTarget.name}"? Current members will keep their profiles but lose their department assignment.`}
          confirmLabel="Delete"
          variant="danger"
          isProcessing={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

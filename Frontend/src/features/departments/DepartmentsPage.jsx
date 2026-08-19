import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog, PageHeader } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
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
      notify({ title: "Department created", variant: "success" });
      setShowCreate(false);
    },
    onError: (error) => notify({ title: "Creation failed", message: getErrorMessage(error), variant: "danger" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => departmentService.delete(id),
    onSuccess: async () => {
      await queryInvalidation.afterDepartmentChange(queryClient);
      notify({ title: "Department deleted", variant: "success" });
      setDeleteTarget(null);
    },
    onError: (error) => notify({ title: "Deletion failed", message: getErrorMessage(error), variant: "danger" }),
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organize people into company teams and reporting areas."
        actions={
          <Button
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> New department
          </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4e6a] text-white text-xs font-bold shrink-0">
                          {dept.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{dept.name}</strong>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employeeCounts[dept.id] ?? 0}</TableCell>
                    <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          title="Delete department"
                          disabled={deleteMutation.isPending}
                          onClick={() => setDeleteTarget(dept)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground px-4 py-3 border-t border-border">
              Members are assigned automatically when employees join a department.
            </p>
          </>
        )}
      </DataTableShell>

      {showCreate && (
          <CreateDepartmentModal
          isSubmitting={createMutation.isPending}
          onCreate={(data) => createMutation.mutate(data.name)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete department"
          message={`Delete "${deleteTarget.name}"? Current members will keep their profiles but lose their department assignment.`}
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

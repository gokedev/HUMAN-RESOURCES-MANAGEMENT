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

  const { data: departments, isLoading, isError } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const { data: employees } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const employeeCounts = useMemo(() => {
    const counts = {};
    if (Array.isArray(employees)) {
      employees.forEach((emp) => {
        if (emp.departmentId) counts[emp.departmentId] = (counts[emp.departmentId] ?? 0) + 1;
      });
    }
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
          <Button type="button" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New department
          </Button>
        }
      />
      <DataTableShell
        title="Department list"
        description={`${!Array.isArray(departments) ? 0 : departments.length} department${!Array.isArray(departments) || departments.length === 1 ? "" : "s"} in your company`}
      >
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <EmptyState
            icon={Building2}
            title="Could not load departments"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => queryClient.invalidateQueries({ queryKey: queryKeys.departments.all })}
          />
        ) : !Array.isArray(departments) || departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments"
            description="Create your first department to start organizing your team."
            actionLabel="New department"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {employeeCounts[dept.id] ?? 0} member{(employeeCounts[dept.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                      type="button"
                      title="Delete department"
                      onClick={() => setDeleteTarget(dept)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableShell>

      {showCreate && (
        <CreateDepartmentModal
          isSubmitting={createMutation.isPending}
          onCreate={(values) => createMutation.mutate(values.name)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete department"
          message={`Permanently delete "${deleteTarget.name}"? Employees in this department will become unassigned.`}
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

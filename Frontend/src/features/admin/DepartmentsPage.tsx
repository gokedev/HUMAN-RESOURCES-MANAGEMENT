import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTableShell } from '../../components/tables/DataTableShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../contexts/ToastContext';
import { departmentService } from '../../services/department.service';
import { employeeService } from '../../services/employee.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';
import { CreateDepartmentModal } from '../../features/departments/CreateDepartmentModal';

export function DepartmentsPage() {
  usePageTitle('Departments');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  const { data: employees } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.list({ page: 0, size: 200 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      notify('Department deleted.', 'success');
      setDeleteTarget(null);
    },
    onError: (error) => {
      notify(getErrorMessage(error), 'danger');
    },
  });

  function getEmployeeCount(deptId: string): number {
    if (!employees) return 0;
    return employees?.content?.filter((e) => e.departmentId === deptId).length ?? 0;
  }

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organize people into company teams and reporting areas."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} /> New department
          </button>
        }
      />
      <DataTableShell title="Department list" description="All departments in your company.">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : departments && departments.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employees</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td><strong>{dept.name}</strong></td>
                    <td>{getEmployeeCount(dept.id)}</td>
                    <td>{new Date(dept.createdAt).toLocaleDateString()}</td>
                    <td className="table-actions">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        type="button"
                        onClick={() => setDeleteTarget({ id: dept.id, name: dept.name })}
                      >
                        <Trash2 size={14} style={{ marginRight: '0.35rem' }} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department to start organizing your team."
          />
        )}
      </DataTableShell>

      {showCreate && <CreateDepartmentModal onClose={() => setShowCreate(false)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete department"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
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

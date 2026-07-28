import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTableShell } from '../../components/tables/DataTableShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../contexts/ToastContext';
import { employeeService } from '../../services/employee.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';
import { CreateEmployeeModal } from '../../features/employees/CreateEmployeeModal';
import { EditEmployeeModal } from '../../features/employees/EditEmployeeModal';
import type { User } from '../../types/api';

export function EmployeesPage() {
  usePageTitle('Employees');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null);

  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employees.list({ page, size: pageSize }),
    queryFn: () => employeeService.list({ page, size: pageSize }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeeService.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      notify('Employee deactivated.', 'success');
      setDeactivateTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => employeeService.reactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      notify('Employee reactivated.', 'success');
      setReactivateTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const employees = data?.content ?? [];
  const filtered = search
    ? employees.filter(
        (e) =>
          e.firstName.toLowerCase().includes(search.toLowerCase()) ||
          e.lastName.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()),
      )
    : employees;

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage workforce records, invitations, reporting lines, and account status."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
            <span className="bi bi-plus-lg" aria-hidden="true" /> Add employee
          </button>
        }
      />
      <DataTableShell
        title="Employee directory"
        description="Search, filter, and sort company users."
        action={
          <input
            className="form-control search-input"
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      >
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <Link to={`/employees/${emp.id}`}>
                          <strong>{emp.firstName} {emp.lastName}</strong>
                        </Link>
                      </td>
                      <td>{emp.email}</td>
                      <td>{emp.jobTitle ?? '—'}</td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td>{emp.dateOfHire ? new Date(emp.dateOfHire).toLocaleDateString() : '—'}</td>
                      <td className="table-actions">
                        <Link className="btn btn-outline-secondary btn-sm" to={`/employees/${emp.id}`}>
                          <span className="bi bi-eye" aria-hidden="true" /> View
                        </Link>
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setEditTarget(emp)}>
                          <span className="bi bi-pencil" aria-hidden="true" /> Edit
                        </button>
                        {emp.status === 'ACTIVE' ? (
                          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => setDeactivateTarget(emp)}>
                            <span className="bi bi-person-x" aria-hidden="true" /> Deactivate
                          </button>
                        ) : emp.status === 'SUSPENDED' ? (
                          <button className="btn btn-outline-success btn-sm" type="button" onClick={() => setReactivateTarget(emp)}>
                            <span className="bi bi-person-check" aria-hidden="true" /> Reactivate
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.page && (
              <Pagination
                currentPage={data.page.number ?? 0}
                totalPages={data.page.totalPages ?? 0}
                totalElements={data.page.totalElements ?? 0}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="bi-person-lines-fill"
            title="No employees found"
            description={search ? 'Try a different search term.' : 'Add your first employee to get started.'}
          />
        )}
      </DataTableShell>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditEmployeeModal employee={editTarget} onClose={() => setEditTarget(null)} />}
      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Are you sure you want to deactivate ${deactivateTarget.firstName} ${deactivateTarget.lastName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          variant="danger"
          isProcessing={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
      {reactivateTarget && (
        <ConfirmDialog
          title="Reactivate employee"
          message={`Reactivate ${reactivateTarget.firstName} ${reactivateTarget.lastName}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          variant="primary"
          isProcessing={reactivateMutation.isPending}
          onConfirm={() => reactivateMutation.mutate(reactivateTarget.id)}
          onClose={() => setReactivateTarget(null)}
        />
      )}
    </>
  );
}

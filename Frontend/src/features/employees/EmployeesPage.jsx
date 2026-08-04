import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, UserX, UserCheck, Users } from 'lucide-react';
import { ConfirmDialog, PageHeader, Pagination, StatusBadge } from '../../components/ui.jsx';
import { DataTableShell, EmptyState, TableSkeleton } from '../../components/feedback.jsx';
import { usePageTitle } from '../../hooks.js';
import { useToast } from '../../contexts.jsx';
import { employeeService } from '../../api.js';
import { queryKeys } from '../../constants.js';
import { getErrorMessage, queryInvalidation } from '../../utils.js';
import { CreateEmployeeModal, EditEmployeeModal, EmployeeDetailsModal } from './EmployeeModals.jsx';
export function EmployeesPage() {
    usePageTitle('Employees');
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [deactivateTarget, setDeactivateTarget] = useState(null);
    const [reactivateTarget, setReactivateTarget] = useState(null);
    const pageSize = 10;
    // Debounce the search box so filtering does not run on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);
    // The API documents no search param, so the full list is fetched and filtered client-side.
    const { data: allEmployees, isLoading } = useQuery({
        queryKey: queryKeys.employees.all,
        queryFn: () => employeeService.listAll(),
    });
    const filteredEmployees = useMemo(() => {
        const query = debouncedSearch.toLowerCase();
        const employees = allEmployees ?? [];
        if (!query) {
            return employees;
        }
        return employees.filter((emp) => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            (emp.jobTitle ?? '').toLowerCase().includes(query));
    }, [allEmployees, debouncedSearch]);
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
    const employees = filteredEmployees.slice(page * pageSize, page * pageSize + pageSize);
    const deactivateMutation = useMutation({
        mutationFn: (id) => employeeService.deactivate(id),
        onSuccess: async () => {
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee deactivated.', 'success');
            setDeactivateTarget(null);
        },
        onError: (error) => notify(getErrorMessage(error), 'danger'),
    });
    const reactivateMutation = useMutation({
        mutationFn: (id) => employeeService.reactivate(id),
        onSuccess: async () => {
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee reactivated.', 'success');
            setReactivateTarget(null);
        },
        onError: (error) => notify(getErrorMessage(error), 'danger'),
    });
    return (<>
      <PageHeader title="Employees" description="Manage workforce records, invitations, reporting lines, and account status." actions={<button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
            <Plus size={16} style={{ marginRight: '0.35rem' }}/> Add employee
          </button>}/>
      <DataTableShell title="Employee directory" description="Search, filter, and sort company users." action={<input className="form-control search-input" type="search" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}/>}>
        {isLoading ? (<TableSkeleton rows={5}/>) : employees.length > 0 ? (<>
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
                  {employees.map((emp) => (<tr key={emp.id}>
                      <td>
                        <button className="link-button" type="button" onClick={() => setViewTarget(emp)}>
                          <strong>{emp.firstName} {emp.lastName}</strong>
                        </button>
                      </td>
                      <td>{emp.email}</td>
                      <td>{emp.jobTitle ?? '—'}</td>
                      <td><StatusBadge status={emp.status}/></td>
                      <td>{emp.dateOfHire ? new Date(emp.dateOfHire).toLocaleDateString() : '—'}</td>
                      <td className="table-actions">
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setViewTarget(emp)}>
                          <Eye size={14} style={{ marginRight: '0.3rem' }}/> View
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setEditTarget(emp)}>
                          <Pencil size={14} style={{ marginRight: '0.3rem' }}/> Edit
                        </button>
                        {emp.status === 'ACTIVE' ? (<button className="btn btn-outline-danger btn-sm" type="button" onClick={() => setDeactivateTarget(emp)}>
                            <UserX size={14} style={{ marginRight: '0.3rem' }}/> Deactivate
                          </button>) : emp.status === 'SUSPENDED' ? (<button className="btn btn-outline-success btn-sm" type="button" onClick={() => setReactivateTarget(emp)}>
                            <UserCheck size={14} style={{ marginRight: '0.3rem' }}/> Reactivate
                          </button>) : null}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} totalElements={filteredEmployees.length} onPageChange={setPage}/>
          </>) : (<EmptyState icon={Users} title="No employees found" description={search ? 'Try a different search term.' : 'Add your first employee to get started.'}/>)}
      </DataTableShell>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)}/>}
      {viewTarget && <EmployeeDetailsModal employee={viewTarget} onClose={() => setViewTarget(null)}/>}
      {editTarget && <EditEmployeeModal employee={editTarget} onClose={() => setEditTarget(null)}/>}
      {deactivateTarget && (<ConfirmDialog title="Deactivate employee" message={`Are you sure you want to deactivate ${deactivateTarget.firstName} ${deactivateTarget.lastName}? They will no longer be able to log in.`} confirmLabel="Deactivate" variant="danger" isProcessing={deactivateMutation.isPending} onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)} onClose={() => setDeactivateTarget(null)}/>)}
      {reactivateTarget && (<ConfirmDialog title="Reactivate employee" message={`Reactivate ${reactivateTarget.firstName} ${reactivateTarget.lastName}? They will be able to log in again.`} confirmLabel="Reactivate" variant="primary" isProcessing={reactivateMutation.isPending} onConfirm={() => reactivateMutation.mutate(reactivateTarget.id)} onClose={() => setReactivateTarget(null)}/>)}
    </>);
}

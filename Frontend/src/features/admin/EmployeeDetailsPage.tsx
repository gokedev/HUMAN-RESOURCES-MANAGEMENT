import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, UserX, UserCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../contexts/ToastContext';
import { employeeService } from '../../services/employee.service';
import { departmentService } from '../../services/department.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';
import { EditEmployeeModal } from '../../features/employees/EditEmployeeModal';

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  usePageTitle('Employee Details');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: queryKeys.employees.detail(id!),
    queryFn: () => employeeService.get(id!),
    enabled: Boolean(id),
  });

  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => employeeService.deactivate(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      notify('Employee deactivated.', 'success');
      setDeactivateTarget(false);
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => employeeService.reactivate(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      notify('Employee reactivated.', 'success');
      setReactivateTarget(false);
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Employee profile" description="Loading..." />
        <CardSkeleton />
      </>
    );
  }

  if (!employee) {
    return (
      <>
        <PageHeader title="Employee not found" description="This employee does not exist." />
        <Link className="btn btn-primary" to="/employees">Back to employees</Link>
      </>
    );
  }

  const departmentName = departments?.find((d) => d.id === employee.departmentId)?.name ?? '—';

  return (
    <>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`Employee profile and account details.`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link className="btn btn-outline-secondary" to="/employees">
              <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back
            </Link>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowEdit(true)}>
              <Pencil size={16} style={{ marginRight: '0.35rem' }} /> Edit
            </button>
            {employee.status === 'ACTIVE' ? (
              <button className="btn btn-outline-danger" type="button" onClick={() => setDeactivateTarget(true)}>
                <UserX size={16} style={{ marginRight: '0.35rem' }} /> Deactivate
              </button>
            ) : employee.status === 'SUSPENDED' ? (
              <button className="btn btn-outline-success" type="button" onClick={() => setReactivateTarget(true)}>
                <UserCheck size={16} style={{ marginRight: '0.35rem' }} /> Reactivate
              </button>
            ) : null}
          </div>
        }
      />

      <section className="profile-panel" style={{ alignItems: 'flex-start' }}>
        <span className="profile-avatar profile-avatar-lg">{employee.firstName.charAt(0).toUpperCase()}</span>
        <div>
          <h2>{employee.firstName} {employee.lastName}</h2>
          <p>{employee.email}</p>
        </div>
      </section>

      <section className="table-shell" style={{ marginTop: '1rem' }}>
        <div className="table-shell-header">
          <div>
            <h2>Details</h2>
          </div>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <div className="form-grid">
            <div>
              <strong>Status</strong>
              <p><StatusBadge status={employee.status} /></p>
            </div>
            <div>
              <strong>Role</strong>
              <p>{employee.role}</p>
            </div>
            <div>
              <strong>Job Title</strong>
              <p>{employee.jobTitle ?? '—'}</p>
            </div>
            <div>
              <strong>Department</strong>
              <p>{departmentName}</p>
            </div>
            <div>
              <strong>Phone</strong>
              <p>{employee.phone ?? '—'}</p>
            </div>
            <div>
              <strong>Hire Date</strong>
              <p>{employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <strong>Created</strong>
              <p>{new Date(employee.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <strong>Last Updated</strong>
              <p>{new Date(employee.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {showEdit && employee && <EditEmployeeModal employee={employee} onClose={() => setShowEdit(false)} />}
      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`}
          confirmLabel="Deactivate"
          variant="danger"
          isProcessing={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate()}
          onClose={() => setDeactivateTarget(false)}
        />
      )}
      {reactivateTarget && (
        <ConfirmDialog
          title="Reactivate employee"
          message={`Reactivate ${employee.firstName} ${employee.lastName}?`}
          confirmLabel="Reactivate"
          variant="primary"
          isProcessing={reactivateMutation.isPending}
          onConfirm={() => reactivateMutation.mutate()}
          onClose={() => setReactivateTarget(false)}
        />
      )}
    </>
  );
}

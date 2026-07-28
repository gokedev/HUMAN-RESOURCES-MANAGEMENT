import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTableShell } from '../../components/tables/DataTableShell';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../contexts/ToastContext';
import { leaveService } from '../../services/leave.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';
import { CreateLeaveModal } from '../../features/leave/CreateLeaveModal';
import type { LeaveRequest } from '../../types/api';

export function MyLeaveRequestsPage() {
  usePageTitle('My Leave Requests');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.leave.mine({ page, size: pageSize }),
    queryFn: () => leaveService.listMine({ page, size: pageSize }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancelMine(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
      notify('Leave request cancelled.', 'success');
      setCancelTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const requests = data?.content ?? [];

  return (
    <>
      <PageHeader
        title="My leave"
        description="Request time off, cancel pending requests, and review your leave history."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
            <span className="bi bi-plus-lg" aria-hidden="true" /> Request leave
          </button>
        }
      />
      <DataTableShell title="Leave history" description="Your personal leave requests.">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : requests.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.leaveType.replace(/_/g, ' ')}</td>
                      <td>{req.startDate}</td>
                      <td>{req.endDate}</td>
                      <td>{req.reason ?? '—'}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td className="table-actions">
                        {req.status === 'PENDING' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            type="button"
                            onClick={() => setCancelTarget(req)}
                          >
                            <span className="bi bi-x-circle" aria-hidden="true" /> Cancel
                          </button>
                        )}
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
            icon="bi-calendar-heart"
            title="No leave requests"
            description="Submit your first leave request to get started."
          />
        )}
      </DataTableShell>

      {showCreate && <CreateLeaveModal onClose={() => setShowCreate(false)} />}
      {cancelTarget && (
        <ConfirmDialog
          title="Cancel leave request"
          message="Are you sure you want to cancel this pending leave request?"
          confirmLabel="Cancel request"
          variant="danger"
          isProcessing={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}

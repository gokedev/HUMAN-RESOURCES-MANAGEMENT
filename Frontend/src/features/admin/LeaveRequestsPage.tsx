import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTableShell } from '../../components/tables/DataTableShell';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { leaveService } from '../../services/leave.service';
import { queryKeys } from '../../constants/queryKeys';
import { ReviewLeaveModal } from '../../features/leave/ReviewLeaveModal';
import type { LeaveRequest } from '../../types/api';

export function LeaveRequestsPage() {
  usePageTitle('Leave Requests');
  const [page, setPage] = useState(0);
  const [reviewTarget, setReviewTarget] = useState<{ request: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.leave.company({ page, size: pageSize }),
    queryFn: () => leaveService.listCompany({ page, size: pageSize }),
  });

  const requests = data?.content ?? [];

  return (
    <>
      <PageHeader
        title="Leave requests"
        description="Review pending requests, approve or reject leave, and track request history."
      />
      <DataTableShell title="Company requests" description="Paginated leave requests from the admin API.">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : requests.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
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
                      <td>{req.employeeId.slice(0, 8)}...</td>
                      <td>{req.leaveType.replace(/_/g, ' ')}</td>
                      <td>{req.startDate}</td>
                      <td>{req.endDate}</td>
                      <td>{req.reason ?? '—'}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td className="table-actions">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-outline-success btn-sm"
                              type="button"
                              onClick={() => setReviewTarget({ request: req, action: 'approve' })}
                            >
                              <span className="bi bi-check-lg" aria-hidden="true" /> Approve
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              onClick={() => setReviewTarget({ request: req, action: 'reject' })}
                            >
                              <span className="bi bi-x-lg" aria-hidden="true" /> Reject
                            </button>
                          </>
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
            icon="bi-inboxes"
            title="No leave requests"
            description="Leave requests from employees will appear here."
          />
        )}
      </DataTableShell>

      {reviewTarget && (
        <ReviewLeaveModal
          request={reviewTarget.request}
          action={reviewTarget.action}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Inbox } from 'lucide-react';
import { PageHeader, Pagination, StatusBadge } from '../../components/ui.jsx';
import { DataTableShell, EmptyState, TableSkeleton } from '../../components/feedback.jsx';
import { useEmployeeNameMap, usePageTitle } from '../../hooks.js';
import { leaveService } from '../../api.js';
import { queryKeys } from '../../constants.js';
import { ReviewLeaveModal } from './LeaveModals.jsx';
export function LeaveRequestsPage() {
    usePageTitle('Leave Requests');
    const [page, setPage] = useState(0);
    const [reviewTarget, setReviewTarget] = useState(null);
    const pageSize = 10;
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.leave.company({ page, size: pageSize }),
        queryFn: () => leaveService.listCompany({ page, size: pageSize }),
    });
    const employeeMap = useEmployeeNameMap();
    const requests = data?.content ?? [];
    return (<>
      <PageHeader title="Leave requests" description="Review pending requests, approve or reject leave, and track request history."/>
      <DataTableShell title="Company requests" description="Paginated leave requests from the admin API.">
        {isLoading ? (<TableSkeleton rows={5}/>) : requests.length > 0 ? (<>
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
                  {requests.map((req) => (<tr key={req.id}>
                      <td><strong>{employeeMap[req.employeeId] ?? `${req.employeeId.slice(0, 8)}...`}</strong></td>
                      <td>{req.leaveType.replace(/_/g, ' ')}</td>
                      <td>{req.startDate}</td>
                      <td>{req.endDate}</td>
                      <td>{req.reason ?? '—'}</td>
                      <td><StatusBadge status={req.status}/></td>
                      <td className="table-actions">
                        {req.status === 'PENDING' && (<>
                            <button className="btn btn-outline-success btn-sm" type="button" onClick={() => setReviewTarget({ request: req, action: 'approve' })}>
                              <Check size={14} style={{ marginRight: '0.3rem' }}/> Approve
                            </button>
                            <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => setReviewTarget({ request: req, action: 'reject' })}>
                              <X size={14} style={{ marginRight: '0.3rem' }}/> Reject
                            </button>
                          </>)}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            {data?.page && (<Pagination currentPage={data.page.number ?? 0} totalPages={data.page.totalPages ?? 0} totalElements={data.page.totalElements ?? 0} onPageChange={setPage}/>)}
          </>) : (<EmptyState icon={Inbox} title="No leave requests" description="Leave requests from employees will appear here."/>)}
      </DataTableShell>

      {reviewTarget && (<ReviewLeaveModal request={reviewTarget.request} action={reviewTarget.action} onClose={() => setReviewTarget(null)}/>)}
    </>);
}

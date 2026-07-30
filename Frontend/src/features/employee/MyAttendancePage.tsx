import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock3 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTableShell } from '../../components/tables/DataTableShell';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../contexts/ToastContext';
import { attendanceService } from '../../services/attendance.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';

export function MyAttendancePage() {
  usePageTitle('My Attendance');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const todayQuery = useQuery({
    queryKey: ['my-attendance', 'today'],
    queryFn: () => attendanceService.listMine({ page: 0, size: 1, sort: 'workDate,desc' }),
  });

  const todayRecord = todayQuery.data?.content?.find((r) => {
    const today = new Date().toISOString().split('T')[0];
    return r.workDate === today;
  });

  const hasCheckedIn = Boolean(todayRecord);
  const hasCheckedOut = hasCheckedIn && Boolean(todayRecord?.checkOut);

  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      notify('Checked in successfully.', 'success');
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      notify('Checked out successfully.', 'success');
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.attendance.mine({ page, size: pageSize }),
    queryFn: () => attendanceService.listMine({ page, size: pageSize }),
  });

  const records = historyQuery.data?.content ?? [];

  return (
    <>
      <PageHeader
        title="My attendance"
        description="Check in, check out, and review your personal attendance history."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!hasCheckedIn ? (
              <button
                className="btn btn-success"
                type="button"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
              >
                {checkInMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <Play size={16} style={{ marginRight: '0.35rem' }} />}
                Check in
              </button>
            ) : !hasCheckedOut ? (
              <button
                className="btn btn-warning"
                type="button"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
              >
                {checkOutMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <Square size={16} style={{ marginRight: '0.35rem' }} />}
                Check out
              </button>
            ) : (
              <span className="badge badge-success">Checked in & out today</span>
            )}
          </div>
        }
      />
      <DataTableShell title="Attendance history" description="Your personal attendance records.">
        {historyQuery.isLoading ? (
          <TableSkeleton rows={5} />
        ) : records.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.workDate}</td>
                      <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}</td>
                      <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}</td>
                      <td><StatusBadge status={rec.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {historyQuery.data?.page && (
              <Pagination
                currentPage={historyQuery.data.page.number ?? 0}
                totalPages={historyQuery.data.page.totalPages ?? 0}
                totalElements={historyQuery.data.page.totalElements ?? 0}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={Clock3}
            title="No attendance records"
            description="Your attendance history will appear here once you check in."
          />
        )}
      </DataTableShell>
    </>
  );
}

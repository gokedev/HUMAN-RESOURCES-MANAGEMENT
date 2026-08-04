import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Square, Clock3 } from 'lucide-react';
import { PageHeader, Pagination, StatusBadge } from '../../components/ui.jsx';
import { DataTableShell, EmptyState, TableSkeleton } from '../../components/feedback.jsx';
import { usePageTitle, useTodayAttendance } from '../../hooks.js';
import { attendanceService } from '../../api.js';
import { queryKeys } from '../../constants.js';
export function MyAttendancePage() {
    usePageTitle('My Attendance');
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const { hasCheckedIn, hasCheckedOut, isCheckingIn, isCheckingOut, checkIn, checkOut, } = useTodayAttendance();
    const historyQuery = useQuery({
        queryKey: queryKeys.attendance.mine({ page, size: pageSize }),
        queryFn: () => attendanceService.listMine({ page, size: pageSize }),
    });
    const records = historyQuery.data?.content ?? [];
    return (<>
      <PageHeader title="My attendance" description="Check in, check out, and review your personal attendance history." actions={<div style={{ display: 'flex', gap: '0.5rem' }}>
            {!hasCheckedIn ? (<button className="btn btn-success" type="button" onClick={checkIn} disabled={isCheckingIn}>
                {isCheckingIn ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : <Play size={16} style={{ marginRight: '0.35rem' }}/>}
                Check in
              </button>) : !hasCheckedOut ? (<button className="btn btn-warning" type="button" onClick={checkOut} disabled={isCheckingOut}>
                {isCheckingOut ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : <Square size={16} style={{ marginRight: '0.35rem' }}/>}
                Check out
              </button>) : (<span className="badge badge-success">Checked in & out today</span>)}
          </div>}/>
      <DataTableShell title="Attendance history" description="Your personal attendance records.">
        {historyQuery.isLoading ? (<TableSkeleton rows={5}/>) : records.length > 0 ? (<>
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
                  {records.map((rec) => (<tr key={rec.id}>
                      <td>{rec.workDate}</td>
                      <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}</td>
                      <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}</td>
                      <td><StatusBadge status={rec.status}/></td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            {historyQuery.data?.page && (<Pagination currentPage={historyQuery.data.page.number ?? 0} totalPages={historyQuery.data.page.totalPages ?? 0} totalElements={historyQuery.data.page.totalElements ?? 0} onPageChange={setPage}/>)}
          </>) : (<EmptyState icon={Clock3} title="No attendance records" description="Your attendance history will appear here once you check in."/>)}
      </DataTableShell>
    </>);
}

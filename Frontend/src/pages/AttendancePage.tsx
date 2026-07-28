import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableShell } from '../components/tables/DataTableShell';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/feedback/EmptyState';
import { usePageTitle } from '../hooks/usePageTitle';
import { attendanceService } from '../services/attendance.service';
import { queryKeys } from '../constants/queryKeys';

export function AttendancePage() {
  usePageTitle('Attendance');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendance.company({ page, size: pageSize }),
    queryFn: () => attendanceService.listCompany({ page, size: pageSize }),
  });

  const records = data?.content ?? [];

  return (
    <>
      <PageHeader
        title="Company attendance"
        description="Review check-ins, check-outs, work dates, and attendance status across the company."
      />
      <DataTableShell title="Attendance records" description="Paginated company attendance from the admin API.">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : records.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.employeeId.slice(0, 8)}...</td>
                      <td>{rec.workDate}</td>
                      <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}</td>
                      <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}</td>
                      <td><StatusBadge status={rec.status} /></td>
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
            icon="bi-calendar2-check"
            title="No attendance records"
            description="Company attendance records will appear here."
          />
        )}
      </DataTableShell>
    </>
  );
}

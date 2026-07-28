import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { employeeService } from '../../services/employee.service';
import { departmentService } from '../../services/department.service';
import { attendanceService } from '../../services/attendance.service';
import { leaveService } from '../../services/leave.service';
import { queryKeys } from '../../constants/queryKeys';

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { session, role } = useAuth();

  const employeeQuery = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.list({ page: 0, size: 1 }),
    enabled: role === 'ADMIN',
  });

  const departmentQuery = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
    enabled: role === 'ADMIN',
  });

  const today = new Date().toISOString().split('T')[0];

  const attendanceQuery = useQuery({
    queryKey: ['dashboard', 'today-attendance'],
    queryFn: () => attendanceService.listCompany({ page: 0, size: 100 }),
    enabled: role === 'ADMIN',
  });

  const leaveQuery = useQuery({
    queryKey: ['dashboard', 'pending-leave'],
    queryFn: () => leaveService.listCompany({ page: 0, size: 100 }),
    enabled: role === 'ADMIN',
  });

  const isLoading = role === 'ADMIN' && (employeeQuery.isLoading || departmentQuery.isLoading);

  const totalEmployees = employeeQuery.data?.page?.totalElements ?? 0;
  const totalDepartments = Array.isArray(departmentQuery.data) ? departmentQuery.data.length : 0;
  const checkedInToday =
    attendanceQuery.data?.content?.filter((r) => r.workDate === today).length ?? 0;
  const pendingLeave = leaveQuery.data?.content?.filter((r) => r.status === 'PENDING').length ?? 0;

  const metrics = role === 'ADMIN'
    ? [
        { label: 'Active employees', value: isLoading ? '—' : String(totalEmployees), icon: 'bi-people' },
        { label: 'Pending leave', value: isLoading ? '—' : String(pendingLeave), icon: 'bi-calendar-heart' },
        { label: 'Checked in today', value: isLoading ? '—' : String(checkedInToday), icon: 'bi-clock' },
        { label: 'Departments', value: isLoading ? '—' : String(totalDepartments), icon: 'bi-diagram-3' },
      ]
    : [
        { label: 'My attendance today', value: '—', icon: 'bi-clock' },
        { label: 'My pending leave', value: '—', icon: 'bi-calendar-heart' },
      ];

  return (
    <>
      <PageHeader
        eyebrow={session?.companySlug}
        title="People operations dashboard"
        description="A focused command center for workforce activity, requests, and company structure."
      />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon bi ${metric.icon}`} aria-hidden="true" />
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        ))}
      </section>
      {role === 'ADMIN' && (
        <section className="dashboard-grid">
          <article className="insight-panel">
            <h2>Recent attendance</h2>
            {attendanceQuery.isLoading ? (
              <TableSkeleton rows={3} />
            ) : attendanceQuery.data && attendanceQuery.data.content.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceQuery.data.content.slice(0, 5).map((record) => (
                      <tr key={record.id}>
                        <td>{record.employeeId.slice(0, 8)}...</td>
                        <td>{record.workDate}</td>
                        <td>{record.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No attendance records yet.</p>
            )}
          </article>
          <article className="insight-panel">
            <h2>Pending leave requests</h2>
            {leaveQuery.isLoading ? (
              <TableSkeleton rows={3} />
            ) : leaveQuery.data && leaveQuery.data.content.filter((r) => r.status === 'PENDING').length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveQuery.data.content
                      .filter((r) => r.status === 'PENDING')
                      .slice(0, 5)
                      .map((req) => (
                        <tr key={req.id}>
                          <td>{req.employeeId.slice(0, 8)}...</td>
                          <td>{req.leaveType}</td>
                          <td>{req.startDate} to {req.endDate}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No pending leave requests.</p>
            )}
          </article>
        </section>
      )}
    </>
  );
}

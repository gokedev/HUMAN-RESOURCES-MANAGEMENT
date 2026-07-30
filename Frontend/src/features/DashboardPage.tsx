import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/ui/PageHeader';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { employeeService } from '../services/employee.service';
import { departmentService } from '../services/department.service';
import { attendanceService } from '../services/attendance.service';
import { leaveService } from '../services/leave.service';
import { queryKeys } from '../constants/queryKeys';
import { getErrorMessage } from '../utils/errors';
import {
  Users, CalendarDays, Clock3, Building2,
  ClipboardCheck, FileClock, Inbox,
  Play, Square, CheckCircle,
} from 'lucide-react';

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { session, role } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

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

  const companyAttendanceQuery = useQuery({
    queryKey: ['dashboard', 'company-attendance'],
    queryFn: () => attendanceService.listCompany({ page: 0, size: 100 }),
    enabled: role === 'ADMIN',
  });

  const companyLeaveQuery = useQuery({
    queryKey: ['dashboard', 'company-leave'],
    queryFn: () => leaveService.listCompany({ page: 0, size: 100 }),
    enabled: role === 'ADMIN',
  });

  const myAttendanceQuery = useQuery({
    queryKey: ['dashboard', 'my-attendance'],
    queryFn: () => attendanceService.listMine({ page: 0, size: 5, sort: 'workDate,desc' }),
    enabled: role === 'EMPLOYEE',
  });

  const myLeaveQuery = useQuery({
    queryKey: ['dashboard', 'my-leave'],
    queryFn: () => leaveService.listMine({ page: 0, size: 5 }),
    enabled: role === 'EMPLOYEE',
  });

  const { data: employeesData } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.list({ page: 0, size: 200 }),
    enabled: role === 'ADMIN',
  });

  const employeeMap = useMemo(() => {
    const map: Record<string, string> = {};
    employeesData?.content?.forEach((emp) => {
      map[emp.id] = `${emp.firstName} ${emp.lastName}`;
    });
    return map;
  }, [employeesData]);

  const todayRecord = myAttendanceQuery.data?.content?.find((r) => r.workDate === today);
  const hasCheckedIn = Boolean(todayRecord);
  const hasCheckedOut = hasCheckedIn && Boolean(todayRecord?.checkOut);

  const pendingLeaveCount = myLeaveQuery.data?.content?.filter((r) => r.status === 'PENDING').length ?? 0;

  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'my-attendance'] });
      notify('Checked in successfully.', 'success');
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'my-attendance'] });
      notify('Checked out successfully.', 'success');
    },
    onError: (error) => notify(getErrorMessage(error), 'danger'),
  });

  const isAdminLoading = employeeQuery.isLoading || departmentQuery.isLoading;
  const totalEmployees = employeeQuery.data?.page?.totalElements ?? 0;
  const totalDepartments = Array.isArray(departmentQuery.data) ? departmentQuery.data.length : 0;
  const checkedInToday = companyAttendanceQuery.data?.content?.filter((r) => r.workDate === today).length ?? 0;
  const pendingLeave = companyLeaveQuery.data?.content?.filter((r) => r.status === 'PENDING').length ?? 0;

  const metrics = role === 'ADMIN'
    ? [
        { label: 'Active employees', value: isAdminLoading ? '—' : String(totalEmployees), Icon: Users },
        { label: 'Pending leave', value: isAdminLoading ? '—' : String(pendingLeave), Icon: CalendarDays },
        { label: 'Checked in today', value: isAdminLoading ? '—' : String(checkedInToday), Icon: Clock3 },
        { label: 'Departments', value: isAdminLoading ? '—' : String(totalDepartments), Icon: Building2 },
      ]
    : [
        { label: 'Today\'s attendance', value: hasCheckedIn && hasCheckedOut ? 'Done' : hasCheckedIn ? 'Checked in' : 'Pending', Icon: Clock3 },
        { label: 'Pending leave', value: String(pendingLeaveCount), Icon: CalendarDays },
      ];

  return (
    <>
      <PageHeader
        eyebrow={session?.companySlug}
        title={role === 'ADMIN' ? 'People operations dashboard' : 'My dashboard'}
        description={role === 'ADMIN' ? 'A focused command center for workforce activity, requests, and company structure.' : 'Your attendance, leave, and quick actions at a glance.'}
      />
      <section className="metric-grid">
        {metrics.map(({ label, value, Icon }) => (
          <article className="metric-card" key={label}>
            <span className="metric-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      {role === 'EMPLOYEE' && (
        <section className="dashboard-actions" style={{ marginTop: '1rem' }}>
          <article className="insight-panel">
            <div className="insight-header">
              <Clock3 size={18} className="insight-icon" />
              <h2>Today's Check-in</h2>
            </div>
            <div className="checkin-body">
              <div className="checkin-time">
                {myAttendanceQuery.isLoading ? (
                  <span className="metric-skeleton" />
                ) : todayRecord ? (
                  <>
                    <span className="checkin-label">Check-in</span>
                    <span className="checkin-value">{todayRecord.checkIn ?? '—'}</span>
                    <span className="checkin-label">Check-out</span>
                    <span className="checkin-value">{todayRecord.checkOut ?? '—'}</span>
                  </>
                ) : (
                  <p style={{ color: 'var(--app-muted)' }}>No record yet today.</p>
                )}
              </div>
              <div className="checkin-actions">
                {!hasCheckedIn ? (
                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ marginRight: '0.4rem' }} /> : <Play size={16} style={{ marginRight: '0.35rem' }} />}
                    Check in
                  </button>
                ) : !hasCheckedOut ? (
                  <button
                    className="btn btn-warning"
                    type="button"
                    onClick={() => checkOutMutation.mutate()}
                    disabled={checkOutMutation.isPending}
                  >
                    {checkOutMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ marginRight: '0.4rem' }} /> : <Square size={16} style={{ marginRight: '0.35rem' }} />}
                    Check out
                  </button>
                ) : (
                  <span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <CheckCircle size={16} style={{ marginRight: '0.35rem' }} /> Completed
                  </span>
                )}
                {todayRecord && (
                  <span className="checkin-status">
                    <StatusBadge status={todayRecord.status} />
                  </span>
                )}
              </div>
            </div>
          </article>
        </section>
      )}

      {role === 'ADMIN' && (
        <section className="dashboard-grid" style={{ marginTop: '1rem' }}>
          <article className="insight-panel">
            <div className="insight-header">
              <ClipboardCheck size={18} className="insight-icon" />
              <h2>Recent attendance</h2>
            </div>
            {companyAttendanceQuery.isLoading ? (
              <TableSkeleton rows={3} />
            ) : companyAttendanceQuery.data && companyAttendanceQuery.data.content.length > 0 ? (
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
                    {companyAttendanceQuery.data.content.slice(0, 5).map((record) => (
                      <tr key={record.id}>
                        <td><strong>{employeeMap[record.employeeId] ?? `${record.employeeId.slice(0, 8)}...`}</strong></td>
                        <td>{record.workDate}</td>
                        <td><StatusBadge status={record.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insight-empty">
                <Inbox size={22} />
                <p>No attendance records yet.</p>
              </div>
            )}
          </article>
          <article className="insight-panel">
            <div className="insight-header">
              <FileClock size={18} className="insight-icon" />
              <h2>Pending leave requests</h2>
            </div>
            {companyLeaveQuery.isLoading ? (
              <TableSkeleton rows={3} />
            ) : companyLeaveQuery.data && companyLeaveQuery.data.content.filter((r) => r.status === 'PENDING').length > 0 ? (
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
                    {companyLeaveQuery.data.content
                      .filter((r) => r.status === 'PENDING')
                      .slice(0, 5)
                      .map((req) => (
                        <tr key={req.id}>
                          <td><strong>{employeeMap[req.employeeId] ?? `${req.employeeId.slice(0, 8)}...`}</strong></td>
                          <td>{req.leaveType.replace(/_/g, ' ')}</td>
                          <td>{req.startDate} to {req.endDate}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insight-empty">
                <Inbox size={22} />
                <p>No pending leave requests.</p>
              </div>
            )}
          </article>
        </section>
      )}
    </>
  );
}

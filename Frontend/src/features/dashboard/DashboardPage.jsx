import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatusBadge } from '../../components/ui.jsx';
import { TableSkeleton } from '../../components/feedback.jsx';
import { useAuth } from '../../contexts.jsx';
import { usePageTitle, useTodayAttendance } from '../../hooks.js';
import { attendanceService, departmentService, employeeService, leaveService } from '../../api.js';
import { queryKeys } from '../../constants.js';
import { Users, CalendarDays, Clock3, Building2, ClipboardCheck, FileClock, Inbox, Play, Square, CheckCircle, } from 'lucide-react';
export function DashboardPage() {
    usePageTitle('Dashboard');
    const { session, role } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const employeeQuery = useQuery({
        queryKey: queryKeys.employees.all,
        queryFn: () => employeeService.listAll(),
        enabled: role === 'ADMIN',
    });
    const departmentQuery = useQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.list(),
        enabled: role === 'ADMIN',
    });
    const companyAttendanceQuery = useQuery({
        queryKey: queryKeys.attendance.company({ page: 0, size: 100 }),
        queryFn: () => attendanceService.listCompany({ page: 0, size: 100 }),
        enabled: role === 'ADMIN',
    });
    const companyLeaveQuery = useQuery({
        queryKey: queryKeys.leave.company({ page: 0, size: 100 }),
        queryFn: () => leaveService.listCompany({ page: 0, size: 100 }),
        enabled: role === 'ADMIN',
    });
    const myLeaveQuery = useQuery({
        queryKey: queryKeys.leave.mine({ page: 0, size: 5 }),
        queryFn: () => leaveService.listMine({ page: 0, size: 5 }),
        enabled: role === 'EMPLOYEE',
    });
    const employeeMap = useMemo(() => {
        const map = {};
        employeeQuery.data?.forEach((emp) => {
            map[emp.id] = `${emp.firstName} ${emp.lastName}`;
        });
        return map;
    }, [employeeQuery.data]);
    const { isLoading: todayIsLoading, todayRecord, hasCheckedIn, hasCheckedOut, isCheckingIn, isCheckingOut, checkIn, checkOut } = useTodayAttendance(role === 'EMPLOYEE');
    const pendingLeaveCount = myLeaveQuery.data?.content?.filter((r) => r.status === 'PENDING').length ?? 0;
    const isAdminLoading = employeeQuery.isLoading || departmentQuery.isLoading;
    const activeEmployees = employeeQuery.data?.filter((e) => e.status === 'ACTIVE').length ?? 0;
    const totalDepartments = Array.isArray(departmentQuery.data) ? departmentQuery.data.length : 0;
    const checkedInToday = companyAttendanceQuery.data?.content?.filter((r) => r.workDate === today).length ?? 0;
    const pendingLeave = companyLeaveQuery.data?.content?.filter((r) => r.status === 'PENDING').length ?? 0;
    const metrics = role === 'ADMIN'
        ? [
            { label: 'Active employees', value: isAdminLoading ? '—' : String(activeEmployees), Icon: Users },
            { label: 'Pending leave', value: isAdminLoading ? '—' : String(pendingLeave), Icon: CalendarDays },
            { label: 'Checked in today', value: isAdminLoading ? '—' : String(checkedInToday), Icon: Clock3 },
            { label: 'Departments', value: isAdminLoading ? '—' : String(totalDepartments), Icon: Building2 },
        ]
        : [
            { label: 'Today\'s attendance', value: hasCheckedIn && hasCheckedOut ? 'Done' : hasCheckedIn ? 'Checked in' : 'Pending', Icon: Clock3 },
            { label: 'Pending leave', value: String(pendingLeaveCount), Icon: CalendarDays },
        ];
    return (<>
      <PageHeader eyebrow={session?.companySlug} title={role === 'ADMIN' ? 'People operations dashboard' : 'My dashboard'} description={role === 'ADMIN' ? 'A focused command center for workforce activity, requests, and company structure.' : 'Your attendance, leave, and quick actions at a glance.'}/>
      <section className="metric-grid">
        {metrics.map(({ label, value, Icon }) => (<article className="metric-card" key={label}>
            <span className="metric-icon" aria-hidden="true">
              <Icon size={22}/>
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>))}
      </section>

      {role === 'EMPLOYEE' && (<section className="dashboard-actions" style={{ marginTop: '1rem' }}>
          <article className="insight-panel">
            <div className="insight-header">
              <Clock3 size={18} className="insight-icon"/>
              <h2>Today's Check-in</h2>
            </div>
            <div className="checkin-body">
              <div className="checkin-time">
                {todayIsLoading ? (<span className="metric-skeleton"/>) : todayRecord ? (<>
                    <span className="checkin-label">Check-in</span>
                    <span className="checkin-value">{todayRecord.checkIn ?? '—'}</span>
                    <span className="checkin-label">Check-out</span>
                    <span className="checkin-value">{todayRecord.checkOut ?? '—'}</span>
                  </>) : (<p style={{ color: 'var(--app-muted)' }}>No record yet today.</p>)}
              </div>
              <div className="checkin-actions">
                {!hasCheckedIn ? (<button className="btn btn-success" type="button" onClick={checkIn} disabled={isCheckingIn}>
                    {isCheckingIn ? <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ marginRight: '0.4rem' }}/> : <Play size={16} style={{ marginRight: '0.35rem' }}/>}
                    Check in
                  </button>) : !hasCheckedOut ? (<button className="btn btn-warning" type="button" onClick={checkOut} disabled={isCheckingOut}>
                    {isCheckingOut ? <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ marginRight: '0.4rem' }}/> : <Square size={16} style={{ marginRight: '0.35rem' }}/>}
                    Check out
                  </button>) : (<span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <CheckCircle size={16} style={{ marginRight: '0.35rem' }}/> Completed
                  </span>)}
                {todayRecord && (<span className="checkin-status">
                    <StatusBadge status={todayRecord.status}/>
                  </span>)}
              </div>
            </div>
          </article>
        </section>)}

      {role === 'ADMIN' && (<section className="dashboard-grid" style={{ marginTop: '1rem' }}>
          <article className="insight-panel">
            <div className="insight-header">
              <ClipboardCheck size={18} className="insight-icon"/>
              <h2>Recent attendance</h2>
            </div>
            {companyAttendanceQuery.isLoading ? (<TableSkeleton rows={3}/>) : companyAttendanceQuery.data && companyAttendanceQuery.data.content.length > 0 ? (<div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyAttendanceQuery.data.content.slice(0, 5).map((record) => (<tr key={record.id}>
                        <td><strong>{employeeMap[record.employeeId] ?? `${record.employeeId.slice(0, 8)}...`}</strong></td>
                        <td>{record.workDate}</td>
                        <td><StatusBadge status={record.status}/></td>
                      </tr>))}
                  </tbody>
                </table>
              </div>) : (<div className="insight-empty">
                <Inbox size={22}/>
                <p>No attendance records yet.</p>
              </div>)}
          </article>
          <article className="insight-panel">
            <div className="insight-header">
              <FileClock size={18} className="insight-icon"/>
              <h2>Pending leave requests</h2>
            </div>
            {companyLeaveQuery.isLoading ? (<TableSkeleton rows={3}/>) : companyLeaveQuery.data && companyLeaveQuery.data.content.filter((r) => r.status === 'PENDING').length > 0 ? (<div className="table-responsive">
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
                    .map((req) => (<tr key={req.id}>
                          <td><strong>{employeeMap[req.employeeId] ?? `${req.employeeId.slice(0, 8)}...`}</strong></td>
                          <td>{req.leaveType.replace(/_/g, ' ')}</td>
                          <td>{req.startDate} to {req.endDate}</td>
                        </tr>))}
                  </tbody>
                </table>
              </div>) : (<div className="insight-empty">
                <Inbox size={22}/>
                <p>No pending leave requests.</p>
              </div>)}
          </article>
        </section>)}
    </>);
}

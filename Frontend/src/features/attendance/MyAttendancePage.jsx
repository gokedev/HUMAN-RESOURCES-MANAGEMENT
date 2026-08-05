import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ClipboardCheck, Clock, LogIn, LogOut } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { AttendanceCalendar } from "../../components/common/charts.jsx";
import { usePageTitle, useTodayAttendance } from "../../hooks.js";
import { attendanceService } from "../../api.js";
import { queryKeys } from "../../constants.js";

const PAGE_SIZE = 10;

export function MyAttendancePage() {
  usePageTitle("My Attendance");
  const [currentPage, setCurrentPage] = useState(0);
  const {
    isLoading: todayLoading,
    todayRecord,
    hasCheckedIn,
    hasCheckedOut,
    isCheckingIn,
    isCheckingOut,
    checkIn,
    checkOut,
  } = useTodayAttendance();
  const { data: monthData } = useQuery({
    queryKey: queryKeys.attendance.mine({ page: 0, size: 100, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: 0, size: 100, sort: "workDate,desc" }),
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.attendance.mine({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
  });
  const history = data?.content ?? [];
  const pagination = data?.page;

  return (
    <>
      <PageHeader
        title="My attendance"
        description="Check in, check out, and review your personal attendance history."
      />
      <section className="checkin-card">
        <div className="metric-header">
          <h3>Today</h3>
          <Clock size={18} className="metric-icon" />
        </div>
        <p className="metric-value">
          {todayRecord?.checkIn
            ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Not checked in"}
        </p>
        <p className="metric-sub">
          {todayRecord?.checkOut
            ? `Checked out at ${new Date(todayRecord.checkOut).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : hasCheckedIn
              ? "You are currently checked in."
              : "Start your workday."}
        </p>
        <div className="quick-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={todayLoading || hasCheckedIn || isCheckingIn}
            onClick={checkIn}
          >
            {isCheckingIn ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <LogIn size={16} style={{ marginRight: "0.35rem" }} />
            )}
            Check in
          </button>
          <button
            className="btn btn-outline-secondary"
            type="button"
            disabled={todayLoading || !hasCheckedIn || hasCheckedOut || isCheckingOut}
            onClick={checkOut}
          >
            {isCheckingOut ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <LogOut size={16} style={{ marginRight: "0.35rem" }} />
            )}
            Check out
          </button>
        </div>
      </section>

      <section className="table-shell">
        <div className="table-shell-header">
          <div>
            <h2>This month</h2>
            <p>Your attendance status day by day.</p>
          </div>
          <CalendarRange size={18} className="metric-icon" />
        </div>
        <div style={{ padding: "1rem" }}>
          <AttendanceCalendar records={monthData?.content ?? []} />
        </div>
      </section>

      <DataTableShell title="History" description="Your personal attendance records.">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : isError ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Could not load attendance"
            description="Check your connection and try again."
          />
        ) : history.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No attendance records"
            description="Your attendance history will appear here once you check in."
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.workDate).toLocaleDateString()}</td>
                      <td>{record.checkIn ? formatTime(record.checkIn) : "—"}</td>
                      <td>{record.checkOut ? formatTime(record.checkOut) : "—"}</td>
                      <td>
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination ? (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalElements={pagination.totalElements}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
        )}
      </DataTableShell>
    </>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

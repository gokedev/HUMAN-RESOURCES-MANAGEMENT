import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ClipboardCheck, Clock, LogIn, LogOut } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { AttendanceCalendar } from "../../components/common/charts.jsx";
import { usePageTitle, useTodayAttendance } from "../../hooks.js";
import { attendanceService, leaveService } from "../../api.js";
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

  const { data: monthDataRaw } = useQuery({
    queryKey: queryKeys.attendance.mine({ page: 0, size: 100, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: 0, size: 100, sort: "workDate,desc" }),
  });

  const { data: historyRaw = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.attendance.mine({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
  });

  const { data: leaveRequests, isLoading, isError } = useQuery({
    queryKey: queryKeys.leave.mine({ page: 0, size: 100, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: 0, size: 100, sort: "createdAt,desc" }),
  });
  const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : [];

  // Process attendance data to show "On Leave" for dates within approved leave periods
  const processAttendanceData = (attendanceRecords) => {
    // Get approved leave requests
    const approvedLeaves = safeLeaveRequests.filter(
      leave => leave.status === "APPROVED"
    );

    // For each attendance record, check if it falls within any approved leave period
    return Array.isArray(attendanceRecords) ? attendanceRecords.map(record => {
      // Check if this date falls within any approved leave period
      const recordDate = new Date(record.workDate);
      const isInApprovedLeave = approvedLeaves.some(leave =>
        recordDate >= new Date(leave.startDate) &&
        recordDate <= new Date(leave.endDate)
      );

      // If in approved leave, override the status to ON_LEAVE
      // Keep original check-in/check-out times if they exist
      if (isInApprovedLeave) {
        return {
          ...record,
          status: "ON_LEAVE",
        };
      }

      return record;
    }) : [];
  };

  const monthData = processAttendanceData(Array.isArray(monthDataRaw?.content) ? monthDataRaw?.content : []);
  const history = processAttendanceData(Array.isArray(historyRaw) ? historyRaw : []);
  const pagination = historyRaw.page ?? null;

  return (
    <>
      <PageHeader
        title="My attendance"
        description="Check in, check out, and review your personal attendance history."
      />
      <section className={`rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 ${hasCheckedOut ? "border-l-4 border-l-primary" : hasCheckedIn ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted"}`}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-foreground">Today</h3>
          <Clock size={18} className="text-primary shrink-0" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {todayRecord?.checkIn
            ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Not checked in"}
        </p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          {todayRecord?.checkOut
            ? `Checked out at ${new Date(todayRecord.checkOut).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : hasCheckedIn
              ? "You are currently checked in."
              : "Start your workday."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Button
            type="button"
            disabled={todayLoading || hasCheckedIn || isCheckingIn}
            onClick={checkIn}
          >
            {isCheckingIn ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogIn size={16} />
            )}
            Check in
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={todayLoading || !hasCheckedIn || hasCheckedOut || isCheckingOut}
            onClick={checkOut}
          >
            {isCheckingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogOut size={16} />
            )}
            Check out
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">This month</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your attendance status day by day.</p>
          </div>
          <CalendarRange size={18} className="text-primary shrink-0" />
        </div>
        <div className="p-4">
          <AttendanceCalendar records={monthData} />
        </div>
      </section>

      <div className="mt-6">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead className="hidden sm:table-cell">Check-out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.workDate).toLocaleDateString()}</TableCell>
                      <TableCell>{record.checkIn ? formatTime(record.checkIn) : "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{record.checkOut ? formatTime(record.checkOut) : "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      </div>
    </>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

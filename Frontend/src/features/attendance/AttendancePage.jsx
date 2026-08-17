import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Eye } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { useEmployeeNameMap, usePageTitle } from "../../hooks.js";
import { attendanceService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { AttendanceDetailsModal } from "./AttendanceModals.jsx";

const PAGE_SIZE = 10;

export function AttendancePage() {
  usePageTitle("Attendance");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.attendance.company({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
    queryFn: () =>
      attendanceService.listCompany({ page: currentPage, size: PAGE_SIZE, sort: "workDate,desc" }),
  });
  const nameMap = useEmployeeNameMap();
  const records = data?.content ?? [];
  const pagination = data?.page;

  return (
    <>
      <PageHeader
        title="Company attendance"
        description="Review check-ins, check-outs, work dates, and attendance status across the company."
      />
      <DataTableShell
        title="Attendance records"
        description="Paginated company attendance records."
      >
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Could not load attendance"
            description="Check your connection and try again."
          />
        ) : records.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No attendance records"
            description="Company attendance records will appear here once employees check in."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{nameMap[record.employeeId] ?? "Unknown employee"}</TableCell>
                    <TableCell>{new Date(record.workDate).toLocaleDateString()}</TableCell>
                    <TableCell>{record.checkIn ? formatTime(record.checkIn) : "—"}</TableCell>
                    <TableCell>{record.checkOut ? formatTime(record.checkOut) : "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          title="View details"
                          onClick={() => setSelected(record)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
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

      {selected && (
        <AttendanceDetailsModal
          record={selected}
          employeeName={nameMap[selected.employeeId] ?? "Unknown employee"}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

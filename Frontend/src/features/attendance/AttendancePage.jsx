import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Eye } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
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
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{nameMap[record.employeeId] ?? "Unknown employee"}</td>
                      <td>{new Date(record.workDate).toLocaleDateString()}</td>
                      <td>{record.checkIn ? formatTime(record.checkIn) : "—"}</td>
                      <td>{record.checkOut ? formatTime(record.checkOut) : "—"}</td>
                      <td>
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="text-end">
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            title="View details"
                            onClick={() => setSelected(record)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
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

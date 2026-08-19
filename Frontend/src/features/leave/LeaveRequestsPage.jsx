import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Filter, Inbox, X } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { useEmployeeNameMap, usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { employeeService, leaveService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { LeaveDetailsModal, ReviewLeaveModal } from "./LeaveModals.jsx";
import { Select } from "../../components/ui/select.jsx";

const PAGE_SIZE = 10;

export function LeaveRequestsPage() {
  usePageTitle("Leave Requests");
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const queryParams = {
    page: currentPage,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterEmployee ? { employeeId: filterEmployee } : {}),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.leave.company(queryParams),
    queryFn: () => leaveService.listCompany(queryParams),
  });
  const nameMap = useEmployeeNameMap();
  const requests = data?.content ?? [];
  const pagination = data?.page;

  const { data: allEmployees = [] } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve, note }) =>
      leaveService.review(id, { approve, note: note ?? undefined }),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      const empName = reviewTarget?.request?.employeeFirstName
        ? `${reviewTarget.request.employeeFirstName} ${reviewTarget.request.employeeLastName}`
        : reviewTarget?.employeeName ?? "employee";
      notify({
        title: reviewTarget?.approve ? "Leave approved" : "Leave rejected",
        message: `Request from ${empName} has been updated.`,
        variant: "success",
      });
      setReviewTarget(null);
    },
    onError: (error) => notify({ title: "Review failed", message: getErrorMessage(error), variant: "danger" }),
  });

  return (
    <>
      <PageHeader
        title="Leave requests"
        description="Review pending requests, approve or reject leave, and track request history."
      />
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Filter size={16} className="text-muted-foreground" />
        <Select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
          className="w-40 h-9"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Select
          value={filterEmployee}
          onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(0); }}
          className="w-56 h-9"
        >
          <option value="">All employees</option>
          {Array.isArray(allEmployees) ? allEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          )) : null}
        </Select>
        {(filterStatus || filterEmployee) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterStatus(""); setFilterEmployee(""); setCurrentPage(0); }}
          >
            Clear filters
          </Button>
        )}
      </div>
      <DataTableShell
        title="Company requests"
        description={`${pagination?.totalElements ?? requests.length} request${(pagination?.totalElements ?? requests.length) === 1 ? "" : "s"}`}
      >
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <EmptyState
            icon={Inbox}
            title="Could not load leave requests"
            description="Check your connection and try again."
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No leave requests"
            description="Leave requests from employees will appear here."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Dates</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.employeeFirstName
                        ? `${request.employeeFirstName} ${request.employeeLastName}`
                        : nameMap[request.employeeId] ?? "Unknown employee"}
                    </TableCell>
                    <TableCell>{request.leaveType.replace(/_/g, " ")}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(request.startDate).toLocaleDateString()} →{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={request.reason}>
                      {request.reason ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {request.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              type="button"
                              title="Approve"
                              onClick={() => setReviewTarget({ request, approve: true })}
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                              type="button"
                              title="Reject"
                              onClick={() => setReviewTarget({ request, approve: false })}
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          title="View details"
                          onClick={() => setSelected(request)}
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
        <LeaveDetailsModal
          request={selected}
          employeeName={
            selected.employeeFirstName
              ? `${selected.employeeFirstName} ${selected.employeeLastName}`
              : nameMap[selected.employeeId] ?? "Unknown employee"
          }
          employeeId={selected.employeeId}
          onClose={() => setSelected(null)}
        />
      )}
      {reviewTarget && (
        <ReviewLeaveModal
          request={reviewTarget.request}
          action={reviewTarget.approve ? "approve" : "reject"}
          isSubmitting={reviewMutation.isPending}
          onReview={(values) =>
            reviewMutation.mutate({
              id: reviewTarget.request.id,
              approve: reviewTarget.approve,
              note: values.note,
            })
          }
          onClose={() => setReviewTarget(null)}
        />
      )}
    </>
  );
}

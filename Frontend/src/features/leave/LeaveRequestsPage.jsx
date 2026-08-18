import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Inbox, X } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { useEmployeeNameMap, usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { leaveService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { LeaveDetailsModal, ReviewLeaveModal } from "./LeaveModals.jsx";

const PAGE_SIZE = 10;

export function LeaveRequestsPage() {
  usePageTitle("Leave Requests");
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.leave.company({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
    queryFn: () =>
      leaveService.listCompany({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
  });
  const nameMap = useEmployeeNameMap();
  const requests = data?.content ?? [];
  const pagination = data?.page;

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve, note }) =>
      leaveService.review(id, { approve, note: note ?? undefined }),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      notify({
        title: reviewTarget?.approve ? "Leave approved" : "Leave rejected",
        message: `Request from ${reviewTarget?.employeeName ?? "employee"} has been updated.`,
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
      <DataTableShell
        title="Company requests"
        description="Paginated leave requests."
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
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{nameMap[request.employeeId] ?? "Unknown employee"}</TableCell>
                    <TableCell>{request.leaveType.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {new Date(request.startDate).toLocaleDateString()} →{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={request.reason}>
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
                              className="h-8 w-8"
                              type="button"
                              title="Approve"
                              onClick={() => setReviewTarget({ request, approve: true })}
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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
          employeeName={nameMap[selected.employeeId] ?? "Unknown employee"}
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

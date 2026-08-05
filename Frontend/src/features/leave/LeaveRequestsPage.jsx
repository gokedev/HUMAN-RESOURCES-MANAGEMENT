import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Inbox, X } from "lucide-react";
import { PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
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
      notify(reviewTarget?.approve ? "Leave approved." : "Leave rejected.", "success");
      setReviewTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
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
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{nameMap[request.employeeId] ?? "Unknown employee"}</td>
                      <td>{request.leaveType.replace(/_/g, " ")}</td>
                      <td>
                        {new Date(request.startDate).toLocaleDateString()} →{" "}
                        {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="table-truncate" title={request.reason}>
                        {request.reason ?? "—"}
                      </td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="text-end">
                        <div className="row-actions">
                          {request.status === "PENDING" && (
                            <>
                              <button
                                className="icon-button"
                                type="button"
                                title="Approve"
                                onClick={() => setReviewTarget({ request, approve: true })}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="icon-button"
                                type="button"
                                title="Reject"
                                onClick={() => setReviewTarget({ request, approve: false })}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className="icon-button"
                            type="button"
                            title="View details"
                            onClick={() => setSelected(request)}
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

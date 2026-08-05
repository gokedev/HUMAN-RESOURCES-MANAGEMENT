import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Inbox, Plus, X } from "lucide-react";
import { ConfirmDialog, PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { leaveService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { CreateLeaveModal } from "./LeaveModals.jsx";

const PAGE_SIZE = 10;

export function MyLeavePage() {
  usePageTitle("My Leave");
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.leave.mine({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
  });
  const requests = data?.content ?? [];
  const pagination = data?.page;

  const createMutation = useMutation({
    mutationFn: (payload) => leaveService.createMine(payload),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      notify("Leave request submitted.", "success");
      setShowCreate(false);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });
  const cancelMutation = useMutation({
    mutationFn: (id) => leaveService.cancelMine(id),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      notify("Leave request cancelled.", "success");
      setCancelTarget(null);
    },
    onError: (error) => notify(getErrorMessage(error), "danger"),
  });

  return (
    <>
      <PageHeader
        title="My leave"
        description="Request time off, cancel pending requests, and review your leave history."
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} style={{ marginRight: "0.35rem" }} /> Request leave
          </button>
        }
      />
      <section className="metric-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>Annual leave balance</h3>
            <CalendarDays size={18} className="metric-icon" />
          </div>
          <p className="metric-value">—</p>
          <p className="metric-sub">Balance endpoint not available yet</p>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <h3>Days approved</h3>
            <CalendarDays size={18} className="metric-icon" />
          </div>
          <p className="metric-value">—</p>
          <p className="metric-sub">Computed once balance is available</p>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <h3>Pending requests</h3>
            <CalendarDays size={18} className="metric-icon" />
          </div>
          <p className="metric-value">{requests.filter((r) => r.status === "PENDING").length}</p>
          <p className="metric-sub">On this page</p>
        </div>
      </section>

      <DataTableShell title="My requests" description="Your personal leave requests.">
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
            description="Submit your first leave request to get started."
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table app-table">
                <thead>
                  <tr>
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
                            <button
                              className="icon-button"
                              type="button"
                              title="Cancel request"
                              onClick={() => setCancelTarget(request)}
                            >
                              <X size={16} />
                            </button>
                          )}
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

      {showCreate && (
        <CreateLeaveModal
          isSubmitting={createMutation.isPending}
          onCreate={(values) => createMutation.mutate(values)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {cancelTarget && (
        <ConfirmDialog
          title="Cancel leave request"
          message={`Cancel your ${cancelTarget.leaveType.replace(/_/g, " ").toLowerCase()} leave from ${new Date(
            cancelTarget.startDate
          ).toLocaleDateString()} to ${new Date(cancelTarget.endDate).toLocaleDateString()}?`}
          confirmLabel="Cancel request"
          variant="danger"
          isProcessing={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}

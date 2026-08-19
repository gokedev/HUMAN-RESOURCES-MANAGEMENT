import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Eye, Inbox, Plus, X } from "lucide-react";
import { ConfirmDialog, PageHeader, Pagination, StatusBadge } from "../../components/common/ui.jsx";
import { Button } from "../../components/ui/button.jsx";
import { DataTableShell, EmptyState, TableSkeleton } from "../../components/feedback.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { usePageTitle } from "../../hooks.js";
import { useAuth, useToast } from "../../contexts.jsx";
import { leaveService, profileService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { CreateLeaveModal, LeaveDetailsModal } from "./LeaveModals.jsx";

const PAGE_SIZE = 10;

export function MyLeavePage() {
  usePageTitle("My Leave");
  const { notify } = useToast();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.leave.mine({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: currentPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.me(),
  });

  const requests = data?.content ?? [];
  const pagination = data?.page;

  const createMutation = useMutation({
    mutationFn: (payload) => leaveService.createMine(payload),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      notify({ title: "Leave submitted", message: "Your request is pending approval.", variant: "success" });
      setShowCreate(false);
    },
    onError: (error) => notify({ title: "Submission failed", message: getErrorMessage(error), variant: "danger" }),
  });
  const cancelMutation = useMutation({
    mutationFn: (id) => leaveService.cancelMine(id),
    onSuccess: async () => {
      await queryInvalidation.afterLeaveChange(queryClient);
      notify({ title: "Leave cancelled", variant: "success" });
      setCancelTarget(null);
    },
    onError: (error) => notify({ title: "Cancellation failed", message: getErrorMessage(error), variant: "danger" }),
  });

  const { data: balances } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leaveService.getMyBalance(),
  });

  const annualBalance = balances?.find((b) => b.leaveType === "ANNUAL");

  return (
    <>
      <PageHeader
        title="My leave"
        description="Request time off, cancel pending requests, and review your leave history."
        actions={
          role === "EMPLOYEE" ? (
            <Button type="button" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Request leave
            </Button>
          ) : null
        }
      />
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Annual leave balance</span>
          <p className="text-2xl font-bold text-foreground mt-2">
            {annualBalance ? annualBalance.remaining : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {annualBalance
              ? `${annualBalance.used} used · ${annualBalance.pending} pending`
              : "No balance data"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Days approved</span>
          <p className="text-2xl font-bold text-foreground mt-2">
            {annualBalance ? annualBalance.used : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">This year</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending requests</span>
          <p className="text-2xl font-bold text-foreground mt-2">{requests.filter((r) => r.status === "PENDING").length}</p>
          <p className="text-sm text-muted-foreground mt-1">On this page</p>
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
            actionLabel="Request leave"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
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
                      {request.reviewNote && (request.status === "REJECTED" || request.status === "APPROVED") && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={request.reviewNote}>
                          {request.reviewNote}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
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
                        {request.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                            type="button"
                            title="Cancel request"
                            onClick={() => setCancelTarget(request)}
                          >
                            <X size={16} />
                          </Button>
                        )}
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
          variant="destructive"
          isProcessing={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {selected && (
        <LeaveDetailsModal
          request={selected}
          employeeName="You"
          employeeId={profile?.id}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

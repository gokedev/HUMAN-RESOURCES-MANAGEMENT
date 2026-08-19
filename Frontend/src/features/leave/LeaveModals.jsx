import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatusBadge } from "../../components/common/ui.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Select } from "../../components/ui/select.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";
import { leaveService } from "../../api.js";

export const leaveTypes = ["ANNUAL", "SICK", "UNPAID", "MATERNITY", "PATERNITY", "OTHER"];

const createLeaveSchema = z.object({
  leaveType: z.enum(leaveTypes, { message: "Please select a leave type." }),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  reason: z.string().optional(),
});

export function CreateLeaveModal({ onCreate, isSubmitting = false, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: { leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" },
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
        </DialogHeader>
        <form
          id="create-leave-form"
          className="space-y-4"
          onSubmit={handleSubmit(onCreate)}
          noValidate
        >
          <div className="space-y-2">
            <Label>Leave type *</Label>
            <Select {...register("leaveType")} className={errors.leaveType ? "border-destructive" : ""}>
              {leaveTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </Select>
            {errors.leaveType && <p className="text-xs text-red-600 dark:text-red-400">{errors.leaveType.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date *</Label>
              <Input type="date" {...register("startDate")} className={errors.startDate ? "border-destructive" : ""} />
              {errors.startDate && <p className="text-xs text-red-600 dark:text-red-400">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End date *</Label>
              <Input type="date" {...register("endDate")} className={errors.endDate ? "border-destructive" : ""} />
              {errors.endDate && <p className="text-xs text-red-600 dark:text-red-400">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea rows={3} {...register("reason")} placeholder="Optional reason for leave..." />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="create-leave-form" disabled={isSubmitting}>
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const reviewLeaveSchema = z.object({
  note: z.string().optional(),
});

export function ReviewLeaveModal({ request, action, onReview, isSubmitting = false, onClose }) {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(reviewLeaveSchema),
    defaultValues: { note: "" },
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{action === "approve" ? "Approve" : "Reject"} leave request</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 mb-4">
          <p className="text-sm"><span className="font-semibold">Type:</span> {request.leaveType.replace(/_/g, " ")}</p>
          <p className="text-sm"><span className="font-semibold">Dates:</span> {request.startDate} to {request.endDate}</p>
          {request.reason && <p className="break-words text-sm"><span className="font-semibold">Reason:</span> {request.reason}</p>}
        </div>
        <form id="review-leave-form" className="space-y-4" onSubmit={handleSubmit(onReview)} noValidate>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea rows={3} {...register("note")} placeholder="Add a comment for the employee..." />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            variant={action === "approve" ? "default" : "destructive"}
            type="submit"
            form="review-leave-form"
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calculateDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 0);
}

export function LeaveDetailsModal({ request, employeeName, employeeId, onClose }) {
  const { data: balance } = useQuery({
    queryKey: ["leave-balance", employeeId, request.leaveType],
    queryFn: () => leaveService.getEmployeeBalanceByType(employeeId, request.leaveType),
    enabled: !!employeeId,
  });

  const daysRequested = calculateDays(request.startDate, request.endDate);
  const isPending = request.status === "PENDING";
  const projectedRemaining = balance ? balance.remaining - (isPending ? daysRequested : 0) : null;
  const wouldBeNegative = projectedRemaining !== null && projectedRemaining < 0;
  const isNegative = balance && balance.remaining < 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Leave request</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4 mb-4">
          <AvatarGradient className="h-14 w-14 text-lg shrink-0" name={employeeName}>
            {employeeName.charAt(0).toUpperCase()}
          </AvatarGradient>
          <div>
            <h3 className="font-semibold text-foreground">{employeeName}</h3>
            <p className="text-sm text-muted-foreground">{request.leaveType.replace(/_/g, " ")} leave</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <ModalField label="Status">
            <StatusBadge status={request.status} />
          </ModalField>
          <ModalField label="Type">{request.leaveType.replace(/_/g, " ")}</ModalField>
          <ModalField label="Start date">{new Date(request.startDate).toLocaleDateString()}</ModalField>
          <ModalField label="End date">{new Date(request.endDate).toLocaleDateString()}</ModalField>
          <ModalField label="Reason">{request.reason ?? "—"}</ModalField>
          <ModalField label="Submitted">{new Date(request.createdAt).toLocaleString()}</ModalField>
          {request.reviewNote && (
            <div className="sm:col-span-2">
              <ModalField label="Review note">{request.reviewNote}</ModalField>
            </div>
          )}
        </div>
        {balance && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Leave Balance ({request.leaveType.replace(/_/g, " ")})</p>
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-foreground">{balance.entitlement}</p>
                <p className="text-xs text-muted-foreground">Entitlement</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{balance.used}</p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${balance.remaining < 0 ? "text-red-600" : "text-foreground"}`}>
                  {balance.remaining}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>
            {balance.pending > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {balance.pending} day{balance.pending !== 1 ? "s" : ""} pending in other requests
              </p>
            )}
            {isPending && daysRequested > 0 && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 text-muted-foreground">Projected remaining if approved:</span>
                  <span className={`font-semibold ${wouldBeNegative ? "text-red-600" : "text-foreground"}`}>
                    {projectedRemaining} day{projectedRemaining !== 1 ? "s" : ""}
                  </span>
                </div>
                {wouldBeNegative && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
                    <AlertTriangle size={14} />
                    <span>This approval would result in a negative balance of {Math.abs(projectedRemaining)} day{Math.abs(projectedRemaining) !== 1 ? "s" : ""}.</span>
                  </div>
                )}
              </div>
            )}
            {!isPending && isNegative && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
                  <AlertTriangle size={14} />
                  <span>Current balance is negative by {Math.abs(balance.remaining)} day{Math.abs(balance.remaining) !== 1 ? "s" : ""}.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModalField({ label, children }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1 break-words text-sm text-foreground">{children}</div>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatusBadge } from "../../components/common/ui.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Select } from "../../components/ui/select.jsx";

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
            {errors.leaveType && <p className="text-xs text-destructive">{errors.leaveType.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date *</Label>
              <Input type="date" {...register("startDate")} className={errors.startDate ? "border-destructive" : ""} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End date *</Label>
              <Input type="date" {...register("endDate")} className={errors.endDate ? "border-destructive" : ""} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
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
        <div className="space-y-1 mb-4">
          <p className="text-sm"><strong>Type:</strong> {request.leaveType.replace(/_/g, " ")}</p>
          <p className="text-sm"><strong>Dates:</strong> {request.startDate} to {request.endDate}</p>
          {request.reason && <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>}
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
            className={action === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LeaveDetailsModal({ request, employeeName, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Leave request</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4 mb-4">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4e6a] text-white text-xl font-bold shrink-0">
            {employeeName.charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 className="font-semibold text-foreground">{employeeName}</h3>
            <p className="text-sm text-muted-foreground">{request.leaveType.replace(/_/g, " ")} leave</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Status</p>
            <p><StatusBadge status={request.status} /></p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Type</p>
            <p className="text-muted-foreground">{request.leaveType.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Start date</p>
            <p className="text-muted-foreground">{new Date(request.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">End date</p>
            <p className="text-muted-foreground">{new Date(request.endDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Reason</p>
            <p className="text-muted-foreground">{request.reason ?? "—"}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Submitted</p>
            <p className="text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
          </div>
          {request.reviewNote && (
            <div className="col-span-2">
              <p className="font-semibold text-foreground">Review note</p>
              <p className="text-muted-foreground">{request.reviewNote}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

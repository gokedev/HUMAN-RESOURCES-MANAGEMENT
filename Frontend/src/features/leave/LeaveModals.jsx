import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal, StatusBadge } from "../../components/common/ui.jsx";

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
    defaultValues: {
      leaveType: "ANNUAL",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });
  return (
    <Modal
      title="Request leave"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            form="create-leave-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              "Submit request"
            )}
          </button>
        </>
      }
    >
      <form
        id="create-leave-form"
        className="stacked-form"
        onSubmit={handleSubmit(onCreate)}
        noValidate
      >
        <label className="form-label">
          Leave type *
          <select
            className={`form-control ${errors.leaveType ? "is-invalid" : ""}`}
            {...register("leaveType")}
          >
            {leaveTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.leaveType ? (
            <span className="invalid-feedback">{errors.leaveType.message}</span>
          ) : null}
        </label>
        <div className="form-grid">
          <label className="form-label">
            Start date *
            <input
              className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
              type="date"
              {...register("startDate")}
            />
            {errors.startDate ? (
              <span className="invalid-feedback">{errors.startDate.message}</span>
            ) : null}
          </label>
          <label className="form-label">
            End date *
            <input
              className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
              type="date"
              {...register("endDate")}
            />
            {errors.endDate ? (
              <span className="invalid-feedback">{errors.endDate.message}</span>
            ) : null}
          </label>
        </div>
        <label className="form-label">
          Reason
          <textarea
            className="form-control"
            rows={3}
            {...register("reason")}
            placeholder="Optional reason for leave..."
          />
        </label>
      </form>
    </Modal>
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
    <Modal
      title={`${action === "approve" ? "Approve" : "Reject"} leave request`}
      onClose={onClose}
      footer={
        <>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`btn btn-${action === "approve" ? "success" : "danger"}`}
            type="submit"
            form="review-leave-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : action === "approve" ? (
              "Approve"
            ) : (
              "Reject"
            )}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.25rem" }}>
          <strong>Type:</strong> {request.leaveType.replace(/_/g, " ")}
        </p>
        <p style={{ margin: "0 0 0.25rem" }}>
          <strong>Dates:</strong> {request.startDate} to {request.endDate}
        </p>
        {request.reason && (
          <p style={{ margin: 0 }}>
            <strong>Reason:</strong> {request.reason}
          </p>
        )}
      </div>
      <form
        id="review-leave-form"
        className="stacked-form"
        onSubmit={handleSubmit(onReview)}
        noValidate
      >
        <label className="form-label">
          Note (optional)
          <textarea
            className="form-control"
            rows={3}
            {...register("note")}
            placeholder="Add a comment for the employee..."
          />
        </label>
      </form>
    </Modal>
  );
}

export function LeaveDetailsModal({ request, employeeName, onClose }) {
  return (
    <Modal title="Leave request" onClose={onClose}>
      <section className="profile-panel" style={{ alignItems: "flex-start", marginBottom: "1rem" }}>
        <span className="profile-avatar profile-avatar-lg">
          {employeeName.charAt(0).toUpperCase()}
        </span>
        <div>
          <h2>{employeeName}</h2>
          <p>{request.leaveType.replace(/_/g, " ")} leave</p>
        </div>
      </section>
      <div className="form-grid">
        <div>
          <strong>Status</strong>
          <p>
            <StatusBadge status={request.status} />
          </p>
        </div>
        <div>
          <strong>Type</strong>
          <p>{request.leaveType.replace(/_/g, " ")}</p>
        </div>
        <div>
          <strong>Start date</strong>
          <p>{new Date(request.startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <strong>End date</strong>
          <p>{new Date(request.endDate).toLocaleDateString()}</p>
        </div>
        <div>
          <strong>Reason</strong>
          <p>{request.reason ?? "—"}</p>
        </div>
        <div>
          <strong>Submitted</strong>
          <p>{new Date(request.createdAt).toLocaleString()}</p>
        </div>
        {request.reviewNote ? (
          <div>
            <strong>Review note</strong>
            <p>{request.reviewNote}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

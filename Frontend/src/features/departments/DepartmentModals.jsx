import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "../../components/common/ui.jsx";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required."),
});

export function CreateDepartmentModal({ onCreate, isSubmitting = false, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: { name: "" },
  });
  return (
    <Modal
      title="New department"
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
            form="create-dept-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              "Create"
            )}
          </button>
        </>
      }
    >
      <form
        id="create-dept-form"
        className="stacked-form"
        onSubmit={handleSubmit(onCreate)}
        noValidate
      >
        <label className="form-label">
          Department name
          <input
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            type="text"
            {...register("name")}
            placeholder="e.g. Engineering"
          />
          {errors.name ? (
            <span className="invalid-feedback">{errors.name.message}</span>
          ) : null}
        </label>
      </form>
    </Modal>
  );
}

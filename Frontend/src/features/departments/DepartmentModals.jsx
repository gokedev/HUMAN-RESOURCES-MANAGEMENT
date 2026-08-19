import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";

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
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>New department</DialogTitle>
        </DialogHeader>
        <form
          id="create-dept-form"
          className="space-y-4"
          onSubmit={handleSubmit(onCreate)}
          noValidate
        >
          <div className="space-y-2">
            <Label>Department name</Label>
            <Input
              type="text"
              {...register("name")}
              placeholder="e.g. Engineering"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
            ) : null}
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-dept-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

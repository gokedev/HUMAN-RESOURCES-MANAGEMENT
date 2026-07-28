import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { departmentService } from '../../services/department.service';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required.'),
});

type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;

interface CreateDepartmentModalProps {
  onClose: () => void;
}

export function CreateDepartmentModal({ onClose }: CreateDepartmentModalProps) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: CreateDepartmentFormValues) {
    setIsSubmitting(true);
    try {
      await departmentService.create(values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      notify('Department created.', 'success');
      onClose();
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title="New department"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="create-dept-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            Create
          </button>
        </>
      }
    >
      <form id="create-dept-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Department name
          <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} type="text" {...register('name')} placeholder="e.g. Engineering" />
          {errors.name ? <span className="invalid-feedback">{errors.name.message}</span> : null}
        </label>
      </form>
    </Modal>
  );
}

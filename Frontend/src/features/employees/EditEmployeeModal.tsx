import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { employeeService } from '../../services/employee.service';
import { departmentService } from '../../services/department.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';
import type { User } from '../../types/api';

const editEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  dateOfHire: z.string().optional(),
});

type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeModalProps {
  employee: User;
  onClose: () => void;
}

export function EditEmployeeModal({ employee, onClose }: EditEmployeeModalProps) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
  });

  useEffect(() => {
    reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone ?? '',
      jobTitle: employee.jobTitle ?? '',
      departmentId: employee.departmentId ?? '',
      dateOfHire: employee.dateOfHire ?? '',
    });
  }, [employee, reset]);

  async function onSubmit(values: EditEmployeeFormValues) {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
      };
      if (values.phone) payload.phone = values.phone;
      if (values.jobTitle) payload.jobTitle = values.jobTitle;
      if (values.departmentId) payload.departmentId = values.departmentId;
      if (values.dateOfHire) payload.dateOfHire = values.dateOfHire;

      await employeeService.update(employee.id, payload as unknown as Parameters<typeof employeeService.update>[1]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      notify('Employee updated.', 'success');
      onClose();
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title="Edit employee"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="edit-emp-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            Save changes
          </button>
        </>
      }
    >
      <form id="edit-emp-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <label className="form-label">
            First name *
            <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} type="text" {...register('firstName')} />
            {errors.firstName ? <span className="invalid-feedback">{errors.firstName.message}</span> : null}
          </label>
          <label className="form-label">
            Last name *
            <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} type="text" {...register('lastName')} />
            {errors.lastName ? <span className="invalid-feedback">{errors.lastName.message}</span> : null}
          </label>
        </div>
        <div className="form-grid">
          <label className="form-label">
            Phone
            <input className="form-control" type="tel" {...register('phone')} />
          </label>
          <label className="form-label">
            Job title
            <input className="form-control" type="text" {...register('jobTitle')} />
          </label>
        </div>
        <label className="form-label">
          Department
          <select className="form-control" {...register('departmentId')}>
            <option value="">Select department</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Date of hire
          <input className="form-control" type="date" {...register('dateOfHire')} />
        </label>
      </form>
    </Modal>
  );
}

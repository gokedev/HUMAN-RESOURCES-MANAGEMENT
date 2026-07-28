import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { leaveService } from '../../services/leave.service';
import { queryKeys } from '../../constants/queryKeys';
import { getErrorMessage } from '../../utils/errors';

const leaveTypes = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'OTHER'] as const;

const createLeaveSchema = z.object({
  leaveType: z.enum(leaveTypes, { message: 'Please select a leave type.' }),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
  reason: z.string().optional(),
});

type CreateLeaveFormValues = z.infer<typeof createLeaveSchema>;

interface CreateLeaveModalProps {
  onClose: () => void;
}

export function CreateLeaveModal({ onClose }: CreateLeaveModalProps) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeaveFormValues>({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: { leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' },
  });

  async function onSubmit(values: CreateLeaveFormValues) {
    setIsSubmitting(true);
    try {
      await leaveService.createMine(values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
      notify('Leave request submitted.', 'success');
      onClose();
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title="Request leave"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="create-leave-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            Submit request
          </button>
        </>
      }
    >
      <form id="create-leave-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Leave type *
          <select className={`form-control ${errors.leaveType ? 'is-invalid' : ''}`} {...register('leaveType')}>
            {leaveTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {errors.leaveType ? <span className="invalid-feedback">{errors.leaveType.message}</span> : null}
        </label>
        <div className="form-grid">
          <label className="form-label">
            Start date *
            <input className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} type="date" {...register('startDate')} />
            {errors.startDate ? <span className="invalid-feedback">{errors.startDate.message}</span> : null}
          </label>
          <label className="form-label">
            End date *
            <input className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} type="date" {...register('endDate')} />
            {errors.endDate ? <span className="invalid-feedback">{errors.endDate.message}</span> : null}
          </label>
        </div>
        <label className="form-label">
          Reason
          <textarea className="form-control" rows={3} {...register('reason')} placeholder="Optional reason for leave..." />
        </label>
      </form>
    </Modal>
  );
}

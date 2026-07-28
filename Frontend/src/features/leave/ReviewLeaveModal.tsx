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
import type { LeaveRequest } from '../../types/api';

const reviewLeaveSchema = z.object({
  note: z.string().optional(),
});

type ReviewLeaveFormValues = z.infer<typeof reviewLeaveSchema>;

interface ReviewLeaveModalProps {
  request: LeaveRequest;
  action: 'approve' | 'reject';
  onClose: () => void;
}

export function ReviewLeaveModal({ request, action, onClose }: ReviewLeaveModalProps) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
  } = useForm<ReviewLeaveFormValues>({
    resolver: zodResolver(reviewLeaveSchema),
    defaultValues: { note: '' },
  });

  async function onSubmit(values: ReviewLeaveFormValues) {
    setIsSubmitting(true);
    try {
      await leaveService.review(request.id, {
        approve: action === 'approve',
        note: values.note || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
      notify(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
      onClose();
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={`${action === 'approve' ? 'Approve' : 'Reject'} leave request`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className={`btn btn-${action === 'approve' ? 'success' : 'danger'}`}
            type="submit"
            form="review-leave-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0 0 0.25rem' }}>
          <strong>Type:</strong> {request.leaveType.replace(/_/g, ' ')}
        </p>
        <p style={{ margin: '0 0 0.25rem' }}>
          <strong>Dates:</strong> {request.startDate} to {request.endDate}
        </p>
        {request.reason && (
          <p style={{ margin: 0 }}>
            <strong>Reason:</strong> {request.reason}
          </p>
        )}
      </div>
      <form id="review-leave-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Note (optional)
          <textarea className="form-control" rows={3} {...register('note')} placeholder="Add a comment for the employee..." />
        </label>
      </form>
    </Modal>
  );
}

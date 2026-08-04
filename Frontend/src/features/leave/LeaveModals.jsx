import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui.jsx';
import { useToast } from '../../contexts.jsx';
import { leaveService } from '../../api.js';
import { getErrorMessage, queryInvalidation } from '../../utils.js';

const leaveTypes = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'OTHER'];
const createLeaveSchema = z.object({
    leaveType: z.enum(leaveTypes, { message: 'Please select a leave type.' }),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    reason: z.string().optional(),
});
export function CreateLeaveModal({ onClose }) {
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(createLeaveSchema),
        defaultValues: { leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' },
    });
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await leaveService.createMine(values);
            await queryInvalidation.afterLeaveChange(queryClient);
            notify('Leave request submitted.', 'success');
            onClose();
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<Modal title="Request leave" onClose={onClose} footer={<>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="create-leave-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
            Submit request
          </button>
        </>}>
      <form id="create-leave-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Leave type *
          <select className={`form-control ${errors.leaveType ? 'is-invalid' : ''}`} {...register('leaveType')}>
            {leaveTypes.map((t) => (<option key={t} value={t}>{t.replace(/_/g, ' ')}</option>))}
          </select>
          {errors.leaveType ? <span className="invalid-feedback">{errors.leaveType.message}</span> : null}
        </label>
        <div className="form-grid">
          <label className="form-label">
            Start date *
            <input className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} type="date" {...register('startDate')}/>
            {errors.startDate ? <span className="invalid-feedback">{errors.startDate.message}</span> : null}
          </label>
          <label className="form-label">
            End date *
            <input className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} type="date" {...register('endDate')}/>
            {errors.endDate ? <span className="invalid-feedback">{errors.endDate.message}</span> : null}
          </label>
        </div>
        <label className="form-label">
          Reason
          <textarea className="form-control" rows={3} {...register('reason')} placeholder="Optional reason for leave..."/>
        </label>
      </form>
    </Modal>);
}

const reviewLeaveSchema = z.object({
    note: z.string().optional(),
});
export function ReviewLeaveModal({ request, action, onClose }) {
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, } = useForm({
        resolver: zodResolver(reviewLeaveSchema),
        defaultValues: { note: '' },
    });
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await leaveService.review(request.id, {
                approve: action === 'approve',
                note: values.note || undefined,
            });
            await queryInvalidation.afterLeaveChange(queryClient);
            notify(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
            onClose();
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<Modal title={`${action === 'approve' ? 'Approve' : 'Reject'} leave request`} onClose={onClose} footer={<>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className={`btn btn-${action === 'approve' ? 'success' : 'danger'}`} type="submit" form="review-leave-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </>}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0 0 0.25rem' }}>
          <strong>Type:</strong> {request.leaveType.replace(/_/g, ' ')}
        </p>
        <p style={{ margin: '0 0 0.25rem' }}>
          <strong>Dates:</strong> {request.startDate} to {request.endDate}
        </p>
        {request.reason && (<p style={{ margin: 0 }}>
            <strong>Reason:</strong> {request.reason}
          </p>)}
      </div>
      <form id="review-leave-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Note (optional)
          <textarea className="form-control" rows={3} {...register('note')} placeholder="Add a comment for the employee..."/>
        </label>
      </form>
    </Modal>);
}

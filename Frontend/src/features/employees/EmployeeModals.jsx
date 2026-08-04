import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, UserX, UserCheck } from 'lucide-react';
import { ConfirmDialog, Modal, StatusBadge } from '../../components/ui.jsx';
import { useToast } from '../../contexts.jsx';
import { departmentService, employeeService } from '../../api.js';
import { queryKeys } from '../../constants.js';
import { getErrorMessage, queryInvalidation } from '../../utils.js';

const createEmployeeSchema = z.object({
    email: z.email('Enter a valid email address.'),
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    departmentId: z.string().optional(),
    dateOfHire: z.string().optional(),
});
export function CreateEmployeeModal({ onClose }) {
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: departments } = useQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.list(),
    });
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            jobTitle: '',
            departmentId: '',
            dateOfHire: '',
        },
    });
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            const payload = {
                email: values.email,
                firstName: values.firstName,
                lastName: values.lastName,
            };
            if (values.phone)
                payload.phone = values.phone;
            if (values.jobTitle)
                payload.jobTitle = values.jobTitle;
            if (values.departmentId)
                payload.departmentId = values.departmentId;
            if (values.dateOfHire)
                payload.dateOfHire = values.dateOfHire;
            await employeeService.create(payload);
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee invited. They will receive an email to set their password.', 'success');
            onClose();
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<Modal title="Add employee" onClose={onClose} footer={<>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="create-emp-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
            Send invitation
          </button>
        </>}>
      <form id="create-emp-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <label className="form-label">
            First name *
            <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} type="text" {...register('firstName')}/>
            {errors.firstName ? <span className="invalid-feedback">{errors.firstName.message}</span> : null}
          </label>
          <label className="form-label">
            Last name *
            <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} type="text" {...register('lastName')}/>
            {errors.lastName ? <span className="invalid-feedback">{errors.lastName.message}</span> : null}
          </label>
        </div>
        <label className="form-label">
          Email *
          <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" {...register('email')}/>
          {errors.email ? <span className="invalid-feedback">{errors.email.message}</span> : null}
        </label>
        <div className="form-grid">
          <label className="form-label">
            Phone
            <input className="form-control" type="tel" {...register('phone')}/>
          </label>
          <label className="form-label">
            Job title
            <input className="form-control" type="text" {...register('jobTitle')}/>
          </label>
        </div>
        <label className="form-label">
          Department
          <select className="form-control" {...register('departmentId')}>
            <option value="">Select department</option>
            {departments?.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </label>
        <label className="form-label">
          Date of hire
          <input className="form-control" type="date" {...register('dateOfHire')}/>
        </label>
      </form>
    </Modal>);
}

const editEmployeeSchema = z.object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    departmentId: z.string().optional(),
    dateOfHire: z.string().optional(),
});
export function EditEmployeeModal({ employee, onClose }) {
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: departments } = useQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.list(),
    });
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
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
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            const payload = {
                email: employee.email,
                firstName: values.firstName,
                lastName: values.lastName,
            };
            if (values.phone)
                payload.phone = values.phone;
            if (values.jobTitle)
                payload.jobTitle = values.jobTitle;
            if (values.departmentId)
                payload.departmentId = values.departmentId;
            if (values.dateOfHire)
                payload.dateOfHire = values.dateOfHire;
            await employeeService.update(employee.id, payload);
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee updated.', 'success');
            onClose();
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<Modal title="Edit employee" onClose={onClose} footer={<>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="edit-emp-form" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
            Save changes
          </button>
        </>}>
      <form id="edit-emp-form" className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <label className="form-label">
            First name *
            <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} type="text" {...register('firstName')}/>
            {errors.firstName ? <span className="invalid-feedback">{errors.firstName.message}</span> : null}
          </label>
          <label className="form-label">
            Last name *
            <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} type="text" {...register('lastName')}/>
            {errors.lastName ? <span className="invalid-feedback">{errors.lastName.message}</span> : null}
          </label>
        </div>
        <div className="form-grid">
          <label className="form-label">
            Phone
            <input className="form-control" type="tel" {...register('phone')}/>
          </label>
          <label className="form-label">
            Job title
            <input className="form-control" type="text" {...register('jobTitle')}/>
          </label>
        </div>
        <label className="form-label">
          Department
          <select className="form-control" {...register('departmentId')}>
            <option value="">Select department</option>
            {departments?.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </label>
        <label className="form-label">
          Date of hire
          <input className="form-control" type="date" {...register('dateOfHire')}/>
        </label>
      </form>
    </Modal>);
}

export function EmployeeDetailsModal({ employee, onClose }) {
    const { notify } = useToast();
    const queryClient = useQueryClient();
    const [showEdit, setShowEdit] = useState(false);
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [showReactivate, setShowReactivate] = useState(false);
    const { data: departments } = useQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.list(),
    });
    const deactivateMutation = useMutation({
        mutationFn: () => employeeService.deactivate(employee.id),
        onSuccess: async () => {
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee deactivated.', 'success');
            setShowDeactivate(false);
            onClose();
        },
        onError: (error) => notify(getErrorMessage(error), 'danger'),
    });
    const reactivateMutation = useMutation({
        mutationFn: () => employeeService.reactivate(employee.id),
        onSuccess: async () => {
            await queryInvalidation.afterEmployeeChange(queryClient);
            notify('Employee reactivated.', 'success');
            setShowReactivate(false);
            onClose();
        },
        onError: (error) => notify(getErrorMessage(error), 'danger'),
    });
    const departmentName = departments?.find((d) => d.id === employee.departmentId)?.name ?? '—';
    return (<>
      <Modal title={`${employee.firstName} ${employee.lastName}`} onClose={onClose} footer={<div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowEdit(true)}>
              <Pencil size={16} style={{ marginRight: '0.35rem' }}/> Edit
            </button>
            {employee.status === 'ACTIVE' ? (<button className="btn btn-outline-danger" type="button" onClick={() => setShowDeactivate(true)}>
                <UserX size={16} style={{ marginRight: '0.35rem' }}/> Deactivate
              </button>) : employee.status === 'SUSPENDED' ? (<button className="btn btn-outline-success" type="button" onClick={() => setShowReactivate(true)}>
                <UserCheck size={16} style={{ marginRight: '0.35rem' }}/> Reactivate
              </button>) : null}
          </div>}>
        <section className="profile-panel" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
          <span className="profile-avatar profile-avatar-lg">{employee.firstName.charAt(0).toUpperCase()}</span>
          <div>
            <h2>{employee.firstName} {employee.lastName}</h2>
            <p>{employee.email}</p>
          </div>
        </section>
        <div className="form-grid">
          <div>
            <strong>Status</strong>
            <p><StatusBadge status={employee.status}/></p>
          </div>
          <div>
            <strong>Role</strong>
            <p>{employee.role}</p>
          </div>
          <div>
            <strong>Job Title</strong>
            <p>{employee.jobTitle ?? '—'}</p>
          </div>
          <div>
            <strong>Department</strong>
            <p>{departmentName}</p>
          </div>
          <div>
            <strong>Phone</strong>
            <p>{employee.phone ?? '—'}</p>
          </div>
          <div>
            <strong>Hire Date</strong>
            <p>{employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <strong>Created</strong>
            <p>{new Date(employee.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <strong>Last Updated</strong>
            <p>{new Date(employee.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </Modal>

      {showEdit && <EditEmployeeModal employee={employee} onClose={() => setShowEdit(false)}/>}
      {showDeactivate && (<ConfirmDialog title="Deactivate employee" message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`} confirmLabel="Deactivate" variant="danger" isProcessing={deactivateMutation.isPending} onConfirm={() => deactivateMutation.mutate()} onClose={() => setShowDeactivate(false)}/>)}
      {showReactivate && (<ConfirmDialog title="Reactivate employee" message={`Reactivate ${employee.firstName} ${employee.lastName}?`} confirmLabel="Reactivate" variant="primary" isProcessing={reactivateMutation.isPending} onConfirm={() => reactivateMutation.mutate()} onClose={() => setShowReactivate(false)}/>)}
    </>);
}

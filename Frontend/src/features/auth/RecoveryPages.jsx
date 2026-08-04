import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts.jsx';
import { usePageTitle } from '../../hooks.js';
import { authService } from '../../api.js';
import { getErrorMessage } from '../../utils.js';
import { acceptInvitationSchema, forgotPasswordSchema, resetPasswordSchema } from './schemas.js';

export function ForgotPasswordPage() {
    usePageTitle('Forgot Password');
    const { notify } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
            companySlug: '',
        },
    });
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await authService.forgotPassword(values);
            notify('If the account exists, a reset link has been sent.', 'success');
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<div className="auth-card">
      <span className="page-eyebrow">Account recovery</span>
      <h2>Reset your password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Email
          <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" {...register('email')}/>
          {errors.email ? <span className="invalid-feedback">{errors.email.message}</span> : null}
        </label>
        <label className="form-label">
          Company slug
          <input className={`form-control ${errors.companySlug ? 'is-invalid' : ''}`} type="text" {...register('companySlug')}/>
          {errors.companySlug ? <span className="invalid-feedback">{errors.companySlug.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
          Send reset link
        </button>
      </form>
      <p className="auth-link">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </div>);
}

export function ResetPasswordPage() {
    usePageTitle('Reset Password');
    const [searchParams] = useSearchParams();
    const { notify } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors }, } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: '',
            newPassword: '',
        },
    });
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setValue('token', token);
        }
    }, [searchParams, setValue]);
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await authService.resetPassword(values);
            notify('Password updated. You can sign in with the new password.', 'success');
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<div className="auth-card">
      <span className="page-eyebrow">New credentials</span>
      <h2>Choose a new password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Reset token
          <input className={`form-control ${errors.token ? 'is-invalid' : ''}`} type="text" {...register('token')}/>
          {errors.token ? <span className="invalid-feedback">{errors.token.message}</span> : null}
        </label>
        <label className="form-label">
          New password
          <input className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`} type="password" {...register('newPassword')}/>
          {errors.newPassword ? <span className="invalid-feedback">{errors.newPassword.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
          Update password
        </button>
      </form>
      <p className="auth-link">
        Back to <Link to="/login">sign in</Link>
      </p>
    </div>);
}

export function AcceptInvitationPage() {
    usePageTitle('Accept Invitation');
    const [searchParams] = useSearchParams();
    const { notify } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors }, } = useForm({
        resolver: zodResolver(acceptInvitationSchema),
        defaultValues: {
            token: '',
            password: '',
        },
    });
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setValue('token', token);
        }
    }, [searchParams, setValue]);
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await authService.acceptInvitation(values);
            notify('Password set successfully. You can now sign in.', 'success');
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<div className="auth-card">
      <span className="page-eyebrow">Accept invitation</span>
      <h2>Set your password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Invitation token
          <input className={`form-control ${errors.token ? 'is-invalid' : ''}`} type="text" {...register('token')}/>
          {errors.token ? <span className="invalid-feedback">{errors.token.message}</span> : null}
        </label>
        <label className="form-label">
          Password
          <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" {...register('password')}/>
          {errors.password ? <span className="invalid-feedback">{errors.password.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
          Set password
        </button>
      </form>
      <p className="auth-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>);
}

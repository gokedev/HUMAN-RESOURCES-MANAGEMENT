import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../features/auth/auth.schemas';
import { usePageTitle } from '../hooks/usePageTitle';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../utils/errors';

export function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
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

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true);

    try {
      await authService.resetPassword(values);
      notify('Password updated. You can sign in with the new password.', 'success');
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <span className="page-eyebrow">New credentials</span>
      <h2>Choose a new password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Reset token
          <input className={`form-control ${errors.token ? 'is-invalid' : ''}`} type="text" {...register('token')} />
          {errors.token ? <span className="invalid-feedback">{errors.token.message}</span> : null}
        </label>
        <label className="form-label">
          New password
          <input className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`} type="password" {...register('newPassword')} />
          {errors.newPassword ? <span className="invalid-feedback">{errors.newPassword.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
          Update password
        </button>
      </form>
      <p className="auth-link">
        Back to <Link to="/login">sign in</Link>
      </p>
    </div>
  );
}

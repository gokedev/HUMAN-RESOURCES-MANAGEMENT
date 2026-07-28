import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../features/auth/auth.schemas';
import { usePageTitle } from '../hooks/usePageTitle';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../utils/errors';

export function ForgotPasswordPage() {
  usePageTitle('Forgot Password');
  const { notify } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      companySlug: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);

    try {
      await authService.forgotPassword(values);
      notify('If the account exists, a reset link has been sent.', 'success');
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <span className="page-eyebrow">Account recovery</span>
      <h2>Reset your password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Email
          <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" {...register('email')} />
          {errors.email ? <span className="invalid-feedback">{errors.email.message}</span> : null}
        </label>
        <label className="form-label">
          Company slug
          <input className={`form-control ${errors.companySlug ? 'is-invalid' : ''}`} type="text" {...register('companySlug')} />
          {errors.companySlug ? <span className="invalid-feedback">{errors.companySlug.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
          Send reset link
        </button>
      </form>
      <p className="auth-link">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

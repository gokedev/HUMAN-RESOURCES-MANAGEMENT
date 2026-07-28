import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { acceptInvitationSchema, type AcceptInvitationFormValues } from '../../features/auth/auth.schemas';
import { usePageTitle } from '../../hooks/usePageTitle';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/errors';

export function AcceptInvitationPage() {
  usePageTitle('Accept Invitation');
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AcceptInvitationFormValues>({
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

  async function onSubmit(values: AcceptInvitationFormValues) {
    setIsSubmitting(true);

    try {
      await authService.acceptInvitation(values);
      notify('Password set successfully. You can now sign in.', 'success');
    } catch (error) {
      notify(getErrorMessage(error), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <span className="page-eyebrow">Accept invitation</span>
      <h2>Set your password</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="form-label">
          Invitation token
          <input className={`form-control ${errors.token ? 'is-invalid' : ''}`} type="text" {...register('token')} />
          {errors.token ? <span className="invalid-feedback">{errors.token.message}</span> : null}
        </label>
        <label className="form-label">
          Password
          <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" {...register('password')} />
          {errors.password ? <span className="invalid-feedback">{errors.password.message}</span> : null}
        </label>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
          Set password
        </button>
      </form>
      <p className="auth-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

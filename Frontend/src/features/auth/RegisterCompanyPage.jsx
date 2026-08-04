import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../../contexts.jsx';
import { registerCompanySchema } from './schemas.js';
import { usePageTitle } from '../../hooks.js';
import { getErrorMessage } from '../../utils.js';
const optionalText = (value) => (value?.trim() ? value.trim() : undefined);
export function RegisterCompanyPage() {
    usePageTitle('Register Company');
    const { registerCompany, isAuthenticated } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(registerCompanySchema),
        defaultValues: {
            companyName: '',
            industry: '',
            country: '',
            adminFirstName: '',
            adminLastName: '',
            adminEmail: '',
            adminPassword: '',
        },
    });
    async function onSubmit(values) {
        setIsSubmitting(true);
        try {
            await registerCompany({
                companyName: values.companyName,
                industry: optionalText(values.industry),
                country: optionalText(values.country),
                adminFirstName: values.adminFirstName,
                adminLastName: values.adminLastName,
                adminEmail: values.adminEmail,
                adminPassword: values.adminPassword,
            });
            notify('Workspace created successfully.', 'success');
        }
        catch (error) {
            notify(getErrorMessage(error), 'danger');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<div className="auth-card">
      <span className="page-eyebrow">Company setup</span>
      <h2>Create your workspace</h2>
      <form className="stacked-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <label className="form-label">
            Company name
            <input className={`form-control ${errors.companyName ? 'is-invalid' : ''}`} type="text" {...register('companyName')}/>
            {errors.companyName ? <span className="invalid-feedback">{errors.companyName.message}</span> : null}
          </label>
          <label className="form-label">
            Industry
            <input className="form-control" type="text" {...register('industry')}/>
          </label>
          <label className="form-label">
            Country
            <input className="form-control" type="text" {...register('country')}/>
          </label>
          <label className="form-label">
            Admin first name
            <input className={`form-control ${errors.adminFirstName ? 'is-invalid' : ''}`} type="text" {...register('adminFirstName')}/>
            {errors.adminFirstName ? <span className="invalid-feedback">{errors.adminFirstName.message}</span> : null}
          </label>
          <label className="form-label">
            Admin last name
            <input className={`form-control ${errors.adminLastName ? 'is-invalid' : ''}`} type="text" {...register('adminLastName')}/>
            {errors.adminLastName ? <span className="invalid-feedback">{errors.adminLastName.message}</span> : null}
          </label>
          <label className="form-label">
            Admin email
            <input className={`form-control ${errors.adminEmail ? 'is-invalid' : ''}`} type="email" {...register('adminEmail')}/>
            {errors.adminEmail ? <span className="invalid-feedback">{errors.adminEmail.message}</span> : null}
          </label>
          <label className="form-label">
            Admin password
            <input className={`form-control ${errors.adminPassword ? 'is-invalid' : ''}`} type="password" {...register('adminPassword')}/>
            {errors.adminPassword ? <span className="invalid-feedback">{errors.adminPassword.message}</span> : null}
          </label>
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
          Create workspace
        </button>
      </form>
      <p className="auth-link">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>);
}

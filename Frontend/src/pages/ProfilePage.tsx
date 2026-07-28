import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/ui/PageHeader';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { profileService } from '../services/profile.service';
import { departmentService } from '../services/department.service';
import { queryKeys } from '../constants/queryKeys';

export function ProfilePage() {
  usePageTitle('Profile');
  const { session } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.me(),
  });

  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Profile" description="Loading..." />
        <CardSkeleton />
      </>
    );
  }

  const user = profile;
  const departmentName = user?.departmentId ? departments?.find((d) => d.id === user.departmentId)?.name : null;

  return (
    <>
      <PageHeader title="Profile" description="Your employee identity and workspace access details." />

      <section className="profile-panel" style={{ alignItems: 'flex-start' }}>
        <span className="profile-avatar profile-avatar-lg">
          {(user?.firstName ?? session?.email ?? '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <h2>{user ? `${user.firstName} ${user.lastName}` : session?.email}</h2>
          <p>{user?.email ?? session?.email} &middot; {user?.role ?? session?.role}</p>
        </div>
      </section>

      <section className="table-shell" style={{ marginTop: '1rem' }}>
        <div className="table-shell-header">
          <div>
            <h2>Account details</h2>
          </div>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <div className="form-grid">
            <div>
              <strong>Email</strong>
              <p>{user?.email ?? session?.email}</p>
            </div>
            <div>
              <strong>Role</strong>
              <p>{user?.role ?? session?.role}</p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{user ? <StatusBadge status={user.status} /> : '—'}</p>
            </div>
            <div>
              <strong>Company</strong>
              <p>{session?.companySlug}</p>
            </div>
            {user?.jobTitle && (
              <div>
                <strong>Job Title</strong>
                <p>{user.jobTitle}</p>
              </div>
            )}
            {departmentName && (
              <div>
                <strong>Department</strong>
                <p>{departmentName}</p>
              </div>
            )}
            {user?.phone && (
              <div>
                <strong>Phone</strong>
                <p>{user.phone}</p>
              </div>
            )}
            {user?.dateOfHire && (
              <div>
                <strong>Hire Date</strong>
                <p>{new Date(user.dateOfHire).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UserRound, KeyRound, Palette, ShieldCheck, Sun, Moon } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components/ui.jsx';
import { CardSkeleton } from '../../components/feedback.jsx';
import { useAuth, useTheme } from '../../contexts.jsx';
import { usePageTitle } from '../../hooks.js';
import { departmentService, profileService } from '../../api.js';
import { queryKeys } from '../../constants.js';
const tabs = [
    { id: 'personal', label: 'Personal Information', icon: UserRound },
    { id: 'password', label: 'Change Password', icon: KeyRound },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: ShieldCheck },
];
export function ProfilePage() {
    usePageTitle('Profile');
    const { session } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('personal');
    const { data: profile, isLoading } = useQuery({
        queryKey: queryKeys.profile.me,
        queryFn: () => profileService.me(),
    });
    const { data: departments } = useQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => departmentService.list(),
    });
    if (isLoading) {
        return (<>
        <PageHeader title="Profile" description="Loading..."/>
        <CardSkeleton />
      </>);
    }
    const user = profile;
    const departmentName = user?.departmentId ? departments?.find((d) => d.id === user.departmentId)?.name : null;
    return (<>
      <PageHeader title="Profile" description="Your employee identity, preferences, and account security."/>

      <section className="profile-panel" style={{ alignItems: 'flex-start' }}>
        <span className="profile-avatar profile-avatar-lg">
          {(user?.firstName ?? session?.email ?? '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <h2>{user ? `${user.firstName} ${user.lastName}` : session?.email}</h2>
          <p>{user?.email ?? session?.email} &middot; {user?.role ?? session?.role}</p>
        </div>
      </section>

      <div className="profile-tabs" style={{ marginTop: '1rem' }}>
        <nav className="nav nav-pills flex-column" aria-label="Profile sections">
          {tabs.map(({ id, label, icon: Icon }) => (<button key={id} className={`nav-link text-start ${activeTab === id ? 'active' : ''}`} type="button" onClick={() => setActiveTab(id)}>
              <Icon size={16} style={{ marginRight: '0.5rem' }}/> {label}
            </button>))}
        </nav>

        <section className="table-shell">
          {activeTab === 'personal' && (<>
              <div className="table-shell-header">
                <div>
                  <h2>Account details</h2>
                  <p>Your personal information and workspace access.</p>
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
                    <p>{user ? <StatusBadge status={user.status}/> : '—'}</p>
                  </div>
                  <div>
                    <strong>Company</strong>
                    <p>{session?.companySlug}</p>
                  </div>
                  {user?.jobTitle && (<div>
                      <strong>Job Title</strong>
                      <p>{user.jobTitle}</p>
                    </div>)}
                  {departmentName && (<div>
                      <strong>Department</strong>
                      <p>{departmentName}</p>
                    </div>)}
                  {user?.phone && (<div>
                      <strong>Phone</strong>
                      <p>{user.phone}</p>
                    </div>)}
                  {user?.dateOfHire && (<div>
                      <strong>Hire Date</strong>
                      <p>{new Date(user.dateOfHire).toLocaleDateString()}</p>
                    </div>)}
                </div>
              </div>
            </>)}

          {activeTab === 'password' && (<>
              <div className="table-shell-header">
                <div>
                  <h2>Change password</h2>
                  <p>Keep your account secure by using a strong, unique password.</p>
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ color: 'var(--app-muted)' }}>
                  Password resets are sent to your email. Use the reset flow below to set a new password.
                </p>
                <Link className="btn btn-outline-primary" to="/forgot-password" style={{ marginTop: '0.5rem' }}>
                  Reset password
                </Link>
              </div>
            </>)}

          {activeTab === 'appearance' && (<>
              <div className="table-shell-header">
                <div>
                  <h2>Appearance</h2>
                  <p>Toggle between light and dark mode to match your preference.</p>
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>Theme</strong>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--app-muted)', fontSize: '0.85rem' }}>
                      Current: {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </p>
                  </div>
                  <button className="btn btn-outline-primary" type="button" onClick={toggleTheme} style={{ minWidth: '130px' }}>
                    {theme === 'dark' ? <Sun size={16} style={{ marginRight: '0.35rem' }}/> : <Moon size={16} style={{ marginRight: '0.35rem' }}/>}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                </div>
              </div>
            </>)}

          {activeTab === 'security' && (<>
              <div className="table-shell-header">
                <div>
                  <h2>Security</h2>
                  <p>Session and workspace information.</p>
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="form-grid">
                  <div>
                    <strong>Signed in as</strong>
                    <p>{user?.email ?? session?.email}</p>
                  </div>
                  <div>
                    <strong>Role</strong>
                    <p>{user?.role ?? session?.role}</p>
                  </div>
                  <div>
                    <strong>Workspace</strong>
                    <p>{session?.companySlug}</p>
                  </div>
                  <div>
                    <strong>Theme preference</strong>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--app-muted)', fontSize: '0.85rem' }}>Stored locally on this device.</p>
                  </div>
                </div>
              </div>
            </>)}
        </section>
      </div>
    </>);
}

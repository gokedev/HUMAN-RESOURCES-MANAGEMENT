import { Sun, Moon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useTheme } from '../contexts/ThemeContext';
import { usePageTitle } from '../hooks/usePageTitle';

export function SettingsPage() {
  usePageTitle('Settings');
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Adjust workspace preferences and interface controls." />
      <section className="table-shell">
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
              {theme === 'dark' ? <Sun size={16} style={{ marginRight: '0.35rem' }} /> : <Moon size={16} style={{ marginRight: '0.35rem' }} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </section>

      <section className="table-shell" style={{ marginTop: '1rem' }}>
        <div className="table-shell-header">
          <div>
            <h2>Account</h2>
            <p>Session and workspace information.</p>
          </div>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <div className="form-grid">
            <div>
              <strong>Theme preference</strong>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--app-muted)', fontSize: '0.85rem' }}>Stored locally on this device.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

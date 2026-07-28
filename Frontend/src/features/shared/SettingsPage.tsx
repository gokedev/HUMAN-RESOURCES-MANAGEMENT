import { PageHeader } from '../../components/ui/PageHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { usePageTitle } from '../../hooks/usePageTitle';

export function SettingsPage() {
  usePageTitle('Settings');
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Adjust workspace preferences and interface controls." />
      <section className="settings-panel">
        <div>
          <h2>Appearance</h2>
          <p>Current theme: {theme}</p>
        </div>
        <button className="btn btn-outline-primary" type="button" onClick={toggleTheme}>
          <span className="bi bi-moon-stars" aria-hidden="true" /> Toggle theme
        </button>
      </section>
    </>
  );
}

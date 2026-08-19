import { Button } from "../../components/ui/button.jsx";
import { useTheme } from "../../contexts.jsx";

/**
 * Appearance tab — simple theme toggle (light/dark).
 */
export function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Toggle between light and dark mode to match your preference.</p>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</span>
            <p className="mt-1 text-sm text-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
          </div>
          <Button variant="outline" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </div>
    </>
  );
}

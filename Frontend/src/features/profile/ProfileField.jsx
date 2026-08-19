import { Pencil } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";

/**
 * Reusable label + value pair used across all profile tabs.
 * Optionally shows a pencil icon to hint that the field is editable.
 */
export function ProfileField({ label, children, showEditIcon }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center mt-1 text-sm text-foreground">
        {children}
        {showEditIcon && (
          <Button variant="ghost" size="icon" className="p-1" title="Edit field">
            <Pencil size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}

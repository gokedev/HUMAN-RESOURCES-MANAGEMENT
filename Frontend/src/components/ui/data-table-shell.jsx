import { cn } from "@/lib/utils";

export function DataTableShell({ title, description, action, children, className }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
        <div>
          {title && <h2 className="font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

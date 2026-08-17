import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn("flex items-start justify-between gap-6 mb-6", className)}>
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 px-6 text-center", className)}>
      {Icon && <Icon className="h-8 w-8 text-primary/60" />}
      {title && <h3 className="font-semibold text-foreground">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
    </div>
  );
}

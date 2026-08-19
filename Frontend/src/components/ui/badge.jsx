import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        info: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const statusVariantMap = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "destructive",
  PRESENT: "success",
  ABSENT: "destructive",
  HALF_DAY: "warning",
  ON_LEAVE: "info",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "info",
};

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

function StatusBadge({ status, className }) {
  const variant = statusVariantMap[status] ?? "secondary";
  return (
    <Badge variant={variant} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };

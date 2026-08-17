import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = "Avatar";

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground", className)}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

const AvatarGradient = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-coral to-coral-strong text-white font-bold items-center justify-center", className)}
    {...props}
  >
    {children}
  </div>
));
AvatarGradient.displayName = "AvatarGradient";

export { Avatar, AvatarFallback, AvatarGradient };

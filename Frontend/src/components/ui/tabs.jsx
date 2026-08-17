import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef(({ className, defaultValue, value: controlledValue, onValueChange, children, ...props }, ref) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const activeTab = controlledValue ?? uncontrolledValue;
  const handleTabChange = (val) => {
    if (!controlledValue) setUncontrolledValue(val);
    onValueChange?.(val);
  };
  return (
    <div ref={ref} className={cn("", className)} data-value={activeTab} {...props}>
      {typeof children === "function"
        ? children({ activeTab, onTabChange: handleTabChange })
        : React.Children.map(children, (child) =>
            React.isValidElement(child) ? React.cloneElement(child, { activeTab, onTabChange: handleTabChange }) : child
          )}
    </div>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, children, activeTab, onTabChange, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child) =>
      React.isValidElement(child) ? React.cloneElement(child, { activeTab, onTabChange }) : child
    )}
  </div>
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, activeTab, onTabChange, ...props }, ref) => (
  <button
    ref={ref}
    role="tab"
    type="button"
    aria-selected={activeTab === value}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeTab === value
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
      className
    )}
    onClick={() => onTabChange?.(value)}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, activeTab, ...props }, ref) => {
  if (activeTab !== value) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

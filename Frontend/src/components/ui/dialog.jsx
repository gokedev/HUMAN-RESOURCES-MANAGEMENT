import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog({ open, onOpenChange, children }) {
  const dialogRef = React.useRef(null);

  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleClose = () => onOpenChange?.(false);
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onOpenChange]);

  function handleDialogClick(e) {
    if (e.target === dialogRef.current) {
      onOpenChange?.(false);
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="fixed inset-0 z-50 flex items-center justify-center border-none bg-transparent p-4 backdrop:bg-black/50 open:flex"
    >
      {children}
    </dialog>
  );
}

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-50 w-full max-w-lg rounded-xl border bg-card p-6 text-card-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200",
      className
    )}
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {children}
    {onClose && (
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-150 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
));
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)} {...props} />;
}

function ConfirmDialog({ title, message, confirmLabel = "Confirm", variant = "destructive", onConfirm, onClose, isProcessing = false }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-150 disabled:pointer-events-none disabled:opacity-50"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 py-2 shadow-sm transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 text-white",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary/90"
            )}
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog };

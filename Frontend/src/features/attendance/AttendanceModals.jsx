import { StatusBadge } from "../../components/common/ui.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { AvatarGradient } from "../../components/ui/avatar.jsx";

export function AttendanceDetailsModal({ record, employeeName, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Attendance record</DialogTitle>
        </DialogHeader>
        <section className="flex items-start gap-4 mb-4">
          <AvatarGradient className="h-12 w-12 text-sm shrink-0" name={employeeName}>
            {employeeName.charAt(0).toUpperCase()}
          </AvatarGradient>
          <div>
            <h2 className="text-base font-semibold text-foreground">{employeeName}</h2>
            <p className="text-sm text-muted-foreground">{new Date(record.workDate).toLocaleDateString()}</p>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
            <div className="mt-1">
              <StatusBadge status={record.status} />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check-in</span>
            <p className="mt-1 text-sm text-foreground">{record.checkIn ? formatDateTime(record.checkIn) : "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check-out</span>
            <p className="mt-1 text-sm text-foreground">{record.checkOut ? formatDateTime(record.checkOut) : "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work date</span>
            <p className="mt-1 text-sm text-foreground">{new Date(record.workDate).toLocaleDateString()}</p>
          </div>
          {record.notes ? (
            <div className="col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
              <p className="mt-1 text-sm text-foreground">{record.notes}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

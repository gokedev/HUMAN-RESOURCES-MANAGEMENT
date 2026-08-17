import { StatusBadge } from "../../components/common/ui.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";

export function AttendanceDetailsModal({ record, employeeName, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Attendance record</DialogTitle>
        </DialogHeader>
        <section className="flex items-start gap-4 mb-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4e6a] text-white text-sm font-bold shrink-0">
            {employeeName.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{employeeName}</h2>
            <p className="text-sm text-muted-foreground">{new Date(record.workDate).toLocaleDateString()}</p>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong className="text-sm font-medium text-foreground">Status</strong>
            <p className="mt-1">
              <StatusBadge status={record.status} />
            </p>
          </div>
          <div>
            <strong className="text-sm font-medium text-foreground">Check-in</strong>
            <p className="mt-1 text-sm text-muted-foreground">{record.checkIn ? formatDateTime(record.checkIn) : "—"}</p>
          </div>
          <div>
            <strong className="text-sm font-medium text-foreground">Check-out</strong>
            <p className="mt-1 text-sm text-muted-foreground">{record.checkOut ? formatDateTime(record.checkOut) : "—"}</p>
          </div>
          <div>
            <strong className="text-sm font-medium text-foreground">Work date</strong>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(record.workDate).toLocaleDateString()}</p>
          </div>
          {record.notes ? (
            <div className="col-span-2">
              <strong className="text-sm font-medium text-foreground">Notes</strong>
              <p className="mt-1 text-sm text-muted-foreground">{record.notes}</p>
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

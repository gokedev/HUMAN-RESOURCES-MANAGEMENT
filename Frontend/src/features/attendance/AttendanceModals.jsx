import { Modal, StatusBadge } from "../../components/common/ui.jsx";

export function AttendanceDetailsModal({ record, employeeName, onClose }) {
  return (
    <Modal title="Attendance record" onClose={onClose}>
      <section className="profile-panel" style={{ alignItems: "flex-start", marginBottom: "1rem" }}>
        <span className="profile-avatar profile-avatar-lg">
          {employeeName.charAt(0).toUpperCase()}
        </span>
        <div>
          <h2>{employeeName}</h2>
          <p>{new Date(record.workDate).toLocaleDateString()}</p>
        </div>
      </section>
      <div className="form-grid">
        <div>
          <strong>Status</strong>
          <p>
            <StatusBadge status={record.status} />
          </p>
        </div>
        <div>
          <strong>Check-in</strong>
          <p>{record.checkIn ? formatDateTime(record.checkIn) : "—"}</p>
        </div>
        <div>
          <strong>Check-out</strong>
          <p>{record.checkOut ? formatDateTime(record.checkOut) : "—"}</p>
        </div>
        <div>
          <strong>Work date</strong>
          <p>{new Date(record.workDate).toLocaleDateString()}</p>
        </div>
        {record.notes ? (
          <div>
            <strong>Notes</strong>
            <p>{record.notes}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

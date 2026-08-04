import { TabbedPage } from '../../components/ui.jsx';
import { AttendancePage } from '../attendance/AttendancePage.jsx';
import { LeaveRequestsPage } from '../leave/LeaveRequestsPage.jsx';

export function OperationsPage() {
    const tabs = [
        { id: 'attendance', label: 'Attendance' },
        { id: 'leave', label: 'Leave Requests' },
    ];
    return (
        <TabbedPage
            tabs={tabs}
            renderContent={(activeId) => (
                <>
                    {activeId === 'attendance' ? <AttendancePage /> : null}
                    {activeId === 'leave' ? <LeaveRequestsPage /> : null}
                </>
            )}
        />
    );
}

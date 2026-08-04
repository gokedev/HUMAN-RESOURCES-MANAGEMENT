import { TabbedPage } from '../../components/ui.jsx';
import { MyAttendancePage } from './MyAttendancePage.jsx';
import { MyLeaveRequestsPage } from './MyLeaveRequestsPage.jsx';

export function MyActivityPage() {
    const tabs = [
        { id: 'attendance', label: 'My Attendance' },
        { id: 'leave', label: 'My Leave' },
    ];
    return (
        <TabbedPage
            tabs={tabs}
            renderContent={(activeId) => (
                <>
                    {activeId === 'attendance' ? <MyAttendancePage /> : null}
                    {activeId === 'leave' ? <MyLeaveRequestsPage /> : null}
                </>
            )}
        />
    );
}

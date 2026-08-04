import { TabbedPage } from '../../components/ui.jsx';
import { EmployeesPage } from '../employees/EmployeesPage.jsx';
import { DepartmentsPage } from '../departments/DepartmentsPage.jsx';

export function OrganizationPage() {
    const tabs = [
        { id: 'employees', label: 'Employees' },
        { id: 'departments', label: 'Departments' },
    ];
    return (
        <TabbedPage
            tabs={tabs}
            renderContent={(activeId) => (
                <>
                    {activeId === 'employees' ? <EmployeesPage /> : null}
                    {activeId === 'departments' ? <DepartmentsPage /> : null}
                </>
            )}
        />
    );
}

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    if (user.role === 'Admin') {
        return <AdminDashboard />;
    }

    return <EmployeeDashboard />;
};

export default Dashboard;

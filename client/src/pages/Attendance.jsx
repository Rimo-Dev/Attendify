import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import { LogIn, LogOut, Download } from 'lucide-react';

const Attendance = () => {
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const { user } = useContext(AuthContext);

    const fetchAttendance = async () => {
        try {
            const endpoint = user.role === 'Admin' ? '/attendance' : '/attendance/my';
            const res = await api.get(endpoint);
            setAttendanceLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [user.role]);

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/check-in');
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to check in');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.put('/attendance/check-out');
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to check out');
        }
    };

    const downloadCSV = () => {
        const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Status', 'Late By (mins)'];
        const rows = attendanceLogs.map(log => [
            format(new Date(log.date), 'yyyy-MM-dd'),
            log.employeeId?.name || user.name,
            log.checkIn ? format(new Date(log.checkIn), 'HH:mm') : '--',
            log.checkOut ? format(new Date(log.checkOut), 'HH:mm') : '--',
            log.status,
            log.lateDuration || 0
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `attendance_export_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const uniqueEmployees = Array.from(
        new Set(attendanceLogs.filter(log => log.employeeId).map(log => log.employeeId._id))
    ).map(id => attendanceLogs.find(log => log.employeeId?._id === id)?.employeeId);

    const filteredLogs = selectedEmployee 
        ? attendanceLogs.filter(log => log.employeeId?._id === selectedEmployee)
        : attendanceLogs;

    if (loading) return <div>Loading attendance logs...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Attendance Log</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track daily check-ins and check-outs</p>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {user.role === 'Admin' && (
                        <select 
                            className="input-field" 
                            style={{ width: 'auto', margin: 0, padding: '8px 16px', height: '40px' }}
                            value={selectedEmployee} 
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                            <option value="">All Employees</option>
                            {uniqueEmployees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={downloadCSV} className="btn" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)' }}>
                        <Download size={20} /> Export CSV
                    </button>
                    <button onClick={handleCheckIn} className="btn btn-primary" style={{ background: 'var(--success)' }}>
                        <LogIn size={20} /> Check In Now
                    </button>
                    <button onClick={handleCheckOut} className="btn btn-primary" style={{ background: 'var(--danger)' }}>
                        <LogOut size={20} /> Check Out
                    </button>
                </div>
            </div>

            <div className="glass-panel table-container" style={{ padding: '24px' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            {user.role === 'Admin' && <th>Employee</th>}
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th>Late By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log._id}>
                                <td>{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                                {user.role === 'Admin' && (
                                    <td style={{ fontWeight: '500' }}>{log.employeeId?.name}</td>
                                )}
                                <td>{log.checkIn ? format(new Date(log.checkIn), 'hh:mm a') : '--'}</td>
                                <td>{log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : '--'}</td>
                                <td>
                                    <span className={`badge badge-${log.status}`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td style={{ color: log.lateDuration > 0 ? 'var(--warning)' : 'inherit' }}>
                                    {log.lateDuration > 0 ? `${log.lateDuration} mins` : '--'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Attendance;

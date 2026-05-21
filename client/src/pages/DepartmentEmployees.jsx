import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Mail, Clock, DollarSign } from 'lucide-react';

const DepartmentEmployees = () => {
    const { departmentName } = useParams();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/employees');
                const decodedName = decodeURIComponent(departmentName);
                
                const deptEmployees = res.data.filter(emp => {
                    const dept = emp.department && emp.department.trim() !== '' ? emp.department : 'Unassigned';
                    return dept === decodedName;
                });
                
                setEmployees(deptEmployees);
            } catch (error) {
                console.error('Failed to fetch employees', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [departmentName]);

    if (loading) return <div>Loading department employees...</div>;

    const decodedName = decodeURIComponent(departmentName);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate('/departments')} className="btn" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>{decodedName} Department</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{employees.length} Employee{employees.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {employees.map(emp => (
                    <div key={emp._id} className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {emp.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{emp.name}</h3>
                                <span className="badge badge-Present" style={{ marginTop: '4px', display: 'inline-block' }}>{emp.role}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Mail size={16} />
                                <span>{emp.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Clock size={16} />
                                <span>{emp.shiftStartTime} - {emp.shiftEndTime}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <DollarSign size={16} />
                                <span> ৳{emp.baseSalary}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {employees.length === 0 && (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No employees found in this department.
                </div>
            )}
        </div>
    );
};

export default DepartmentEmployees;

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Wallet } from 'lucide-react';

const EmployeeDashboard = () => {
    const { user } = useContext(AuthContext);
    const [salaryPrediction, setSalaryPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalary = async () => {
            try {
                const res = await api.get('/salary/predict');
                setSalaryPrediction(res.data);
            } catch (error) {
                console.error("Error fetching salary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSalary();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome back, {user.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Here is your personal attendance and salary overview for this month.</p>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Salary Prediction</h2>
            {salaryPrediction ? (
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '32px' }}>
                         <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={40} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '8px' }}>Estimated Net Pay</p>
                            <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                {salaryPrediction.currency}{salaryPrediction.predictedSalary}
                            </h2>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Base Salary</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{salaryPrediction.currency}{salaryPrediction.baseSalary}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Present Days</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{salaryPrediction.presentDays} / {salaryPrediction.workingDaysInMonth}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Late Days</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{salaryPrediction.lateDays} ({salaryPrediction.totalLateMinutes}m)</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Deductions</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                {salaryPrediction.currency}{(parseFloat(salaryPrediction.lateDeduction) + parseFloat(salaryPrediction.absentDeduction)).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <p>Unable to load salary data.</p>
            )}
        </div>
    );
};

export default EmployeeDashboard;

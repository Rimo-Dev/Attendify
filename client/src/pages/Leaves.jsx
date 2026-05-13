import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import { CalendarPlus, Check, X } from 'lucide-react';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user } = useContext(AuthContext);
    const canApplyLeave = user?.role !== 'Admin';

    const [formData, setFormData] = useState({
        startDate: '', endDate: '', type: 'Casual', reason: ''
    });

    const fetchLeaves = async () => {
        try {
            const endpoint = user.role === 'Admin' ? '/leaves' : '/leaves/my';
            const res = await api.get(endpoint);
            setLeaves(res.data);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [user.role]);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!canApplyLeave) return;
        try {
            await api.post('/leaves', formData);
            setShowModal(false);
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to apply for leave');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/leaves/${id}`, { status });
            fetchLeaves();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading leaves...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Leave Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage time off and absences</p>
                </div>
                
                {canApplyLeave && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <CalendarPlus size={20} /> Apply Leave
                    </button>
                )}
            </div>

            <div className="glass-panel table-container" style={{ padding: '24px' }}>
                <table>
                    <thead>
                        <tr>
                            {user.role === 'Admin' && <th>Employee</th>}
                            <th>Type</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {user.role === 'Admin' && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id}>
                                {user.role === 'Admin' && (
                                    <td style={{ fontWeight: '500' }}>{leave.employeeId?.name}</td>
                                )}
                                <td>{leave.type}</td>
                                <td>
                                    {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                                </td>
                                <td style={{ color: 'var(--text-muted)', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {leave.reason}
                                </td>
                                <td>
                                    <span className={`badge badge-${leave.status}`}>
                                        {leave.status}
                                    </span>
                                </td>
                                {user.role === 'Admin' && (
                                    <td>
                                        {leave.status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => updateStatus(leave._id, 'Approved')} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => updateStatus(leave._id, 'Rejected')} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Apply Leave Modal */}
            {canApplyLeave && showModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '500px', marginTop: '50px', marginBottom: '50px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Apply for Leave</h2>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Leave Type</label>
                                <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="Casual">Casual Leave</option>
                                    <option value="Sick">Sick Leave</option>
                                    <option value="Annual">Annual Leave</option>
                                </select>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Start Date</label>
                                    <input type="date" className="input-field" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>End Date</label>
                                    <input type="date" className="input-field" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Reason</label>
                                <textarea className="input-field" rows="3" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Application</button>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Leaves;

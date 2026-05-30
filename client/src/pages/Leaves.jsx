import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import { CalendarPlus, Check, X, Edit2, Trash2 } from 'lucide-react';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterName, setFilterName] = useState('');
    const { user } = useContext(AuthContext);
    const isManager = user?.role === 'Admin' || user?.role === 'HR';
    const canApplyLeave = user?.role !== 'Admin';

    const [formData, setFormData] = useState({
        startDate: '', endDate: '', type: 'Casual', reason: ''
    });

    const fetchLeaves = async () => {
        try {
            const endpoint = isManager ? '/leaves' : '/leaves/my';
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
    }, [isManager]);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!canApplyLeave) return;
        try {
            if (editingId) {
                await api.put(`/leaves/edit/${editingId}`, formData);
            } else {
                await api.post('/leaves', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ startDate: '', endDate: '', type: 'Casual', reason: '' });
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to apply for leave');
        }
    };

    const handleEdit = (leave) => {
        setFormData({
            startDate: leave.startDate.split('T')[0],
            endDate: leave.endDate.split('T')[0],
            type: leave.type,
            reason: leave.reason
        });
        setEditingId(leave._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave?')) {
            try {
                await api.delete(`/leaves/${id}`);
                fetchLeaves();
            } catch (error) {
                alert('Failed to delete leave');
            }
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

    const filteredLeaves = leaves.filter(leave => {
        let match = true;
        if (filterStatus && leave.status !== filterStatus) match = false;
        if (filterName && isManager && leave.employeeId?.name) {
            if (!leave.employeeId.name.toLowerCase().includes(filterName.toLowerCase())) match = false;
        }
        if (filterMonth) {
            const leaveMonth = new Date(leave.startDate).getMonth() + 1; // 1-12
            const leaveYear = new Date(leave.startDate).getFullYear();
            const [fYear, fMonth] = filterMonth.split('-');
            if (leaveYear.toString() !== fYear || leaveMonth.toString() !== parseInt(fMonth).toString()) {
                match = false;
            }
        }
        return match;
    });

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Leave Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage time off and absences</p>
                </div>
                
                {canApplyLeave && (
                    <button onClick={() => {
                        setEditingId(null);
                        setFormData({ startDate: '', endDate: '', type: 'Casual', reason: '' });
                        setShowModal(true);
                    }} className="btn btn-primary">
                        <CalendarPlus size={20} /> Apply Leave
                    </button>
                )}
            </div>

            {isManager && (
                <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Filters:</span>
                    <input 
                        type="text" 
                        placeholder="Search Employee..." 
                        className="input-field" 
                        style={{ width: '200px', padding: '8px 12px' }}
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                    />
                    <input 
                        type="month" 
                        className="input-field" 
                        style={{ width: '180px', padding: '8px 12px' }}
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                    />
                    <select 
                        className="input-field" 
                        style={{ width: '150px', padding: '8px 12px' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    {(filterMonth || filterStatus || filterName) && (
                        <button onClick={() => { setFilterMonth(''); setFilterStatus(''); setFilterName(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            <div className="glass-panel table-container" style={{ padding: '24px' }}>
                <table>
                    <thead>
                        <tr>
                            {isManager && <th>Employee</th>}
                            <th>Type</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {isManager && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.map(leave => (
                            <tr key={leave._id}>
                                {isManager && (
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
                                {isManager && (
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {leave.status === 'Pending' && (
                                            <>
                                                {((leave.employeeId?.role === 'HR' && user.role === 'Admin') || (leave.employeeId?.role === 'Employee' && user.role === 'HR')) && (
                                                    <>
                                                        <button onClick={() => updateStatus(leave._id, 'Approved')} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Approve">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => updateStatus(leave._id, 'Rejected')} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Reject">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {leave.employeeId?._id === user._id && (
                                                    <button onClick={() => handleEdit(leave)} style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {((leave.employeeId?.role === 'HR' && user.role === 'Admin') || (leave.employeeId?.role === 'Employee' && user.role === 'HR') || (leave.employeeId?._id === user._id && leave.status === 'Pending')) && (
                                            <button onClick={() => handleDelete(leave._id)} style={{ background: 'none', color: 'var(--danger)', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)' }} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
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
                        <h2 style={{ marginBottom: '24px' }}>{editingId ? 'Edit Leave' : 'Apply for Leave'}</h2>
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
                                    <input type="date" className="input-field" required value={formData.startDate} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>End Date</label>
                                    <input type="date" className="input-field" required value={formData.endDate} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Reason</label>
                                <textarea className="input-field" rows="3" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Submit Application'}</button>
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

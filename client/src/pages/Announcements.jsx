import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Megaphone, Plus, Trash2, Calendar, Edit2 } from 'lucide-react';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const { user } = useContext(AuthContext);

    const isAdmin = user?.role === 'Admin';

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/announcements/${editingId}`, formData);
            } else {
                const res = await api.post('/announcements', formData);
                const notice = res.data?.emailNotice;
                if (notice && notice.sent === false) {
                    const msg = [notice.reason, notice.error, notice.hint].filter(Boolean).join('\n\n');
                    alert(
                        msg ||
                            'Announcement saved, but notification email was not sent (check server logs).'
                    );
                }
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', content: '' });
            fetchAnnouncements();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save announcement');
        }
    };

    const handleEdit = (announcement) => {
        setFormData({ title: announcement.title, content: announcement.content });
        setEditingId(announcement._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await api.delete(`/announcements/${id}`);
                fetchAnnouncements();
            } catch (error) {
                alert('Failed to delete announcement');
            }
        }
    };

    if (loading) return <div>Loading announcements...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Announcements</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Company updates and important notices</p>
                </div>
                {isAdmin && (
                    <button onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', content: '' });
                        setShowModal(true);
                    }} className="btn btn-primary">
                        <Plus size={20} /> Post Announcement
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {announcements.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Megaphone size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No announcements posted yet.</p>
                    </div>
                ) : (
                    announcements.map(announcement => (
                        <div key={announcement._id} className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
                            {isAdmin && (
                                <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleEdit(announcement)} 
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                                        title="Edit Announcement"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(announcement._id)} 
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        title="Delete Announcement"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                                    <Megaphone size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{announcement.title}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={14} />
                                            {new Date(announcement.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        <span>•</span>
                                        <span>Posted by {announcement.createdBy?.name || 'Admin'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '24px', lineHeight: '1.6', color: 'var(--text-color)', whiteSpace: 'pre-wrap', padding: '16px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                                {announcement.content}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '600px', marginTop: '50px', marginBottom: '50px' }}>
                        <h2 style={{ marginBottom: '24px' }}>{editingId ? 'Edit Announcement' : 'Post New Announcement'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Title</label>
                                <input 
                                    type="text" 
                                    placeholder="Announcement Title" 
                                    className="input-field" 
                                    required 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Message Content</label>
                                <textarea 
                                    placeholder="Write your announcement here..." 
                                    className="input-field" 
                                    required 
                                    rows="6"
                                    style={{ resize: 'vertical' }}
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})} 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>{editingId ? 'Save Changes' : 'Post Announcement'}</button>
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

export default Announcements;

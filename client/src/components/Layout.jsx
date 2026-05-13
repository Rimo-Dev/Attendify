import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Megaphone, Clock, CalendarDays, LogOut } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);

    const isAdmin = user?.role === 'Admin';

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Announcements', path: '/announcements', icon: Megaphone },
        { name: isAdmin ? 'Attendance' : 'My Attendance', path: '/attendance', icon: Clock },
        { name: isAdmin ? 'Leaves' : 'My Leaves', path: '/leaves', icon: CalendarDays },
    ];

    if (isAdmin) {
        navItems.splice(1, 0, { name: 'Employees', path: '/employees', icon: Users });
        navItems.splice(2, 0, { name: 'Departments', path: '/departments', icon: Building2 });
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', padding: '24px', display: 'flex', flexDirection: 'column' }} className="glass-panel">
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>AttendancePro</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Management System</p>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    background: isActive ? 'var(--primary)' : 'transparent',
                                    transition: 'all 0.3s ease'
                                })}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '32px', overflowY: 'auto', height: '100vh' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

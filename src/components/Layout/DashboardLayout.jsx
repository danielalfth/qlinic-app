import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navConfig = {
  pasien: [
    { path: '/patient/schedule', label: 'Jadwal Dokter', icon: 'calendar' },
    { path: '/patient/queue', label: 'Status Antrean', icon: 'queue' },
    { path: '/patient/medical-records', label: 'Rekam Medis', icon: 'medical' },
    { path: '/patient/profile', label: 'Profil', icon: 'profile' },
  ],
  dokter: [
    { path: '/doctor/schedule', label: 'Jadwal Dokter', icon: 'calendar' },
    { path: '/doctor/patients', label: 'Daftar Pasien', icon: 'queue' },
    { path: '/doctor/medical-records', label: 'Rekam Medis', icon: 'medical' },
    { path: '/doctor/profile', label: 'Profil', icon: 'profile' },
  ],
  admin: [
    { path: '/admin/schedule', label: 'Jadwal Dokter', icon: 'calendar' },
    { path: '/admin/queue', label: 'Manajemen Antrean', icon: 'queue' },
    { path: '/admin/medical-records', label: 'Rekam Medis', icon: 'medical' },
    { path: '/admin/profile', label: 'Profil', icon: 'profile' },
  ],
};

const icons = {
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = navConfig[user?.role] || [];
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const roleLabels = { pasien: 'Pasien', dokter: 'Dokter', admin: 'Admin' };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/images/logo.png" alt="Qlinic"/>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {icons[link.icon]}
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.fullName || user?.full_name}</div>
              <div className="sidebar-user-role">{roleLabels[user?.role]}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            Keluar
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, login } = useAuth();

  // --- Edit Name state ---
  const currentName = user?.fullName || user?.full_name || '';
  const [nameForm, setNameForm] = useState({ fullName: currentName });
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState(null); // { type: 'success'|'error', text }

  // --- Change Password state ---
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const roleLabels = { pasien: 'Pasien', dokter: 'Dokter', admin: 'Admin' };
  const initials = currentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  // --- Handlers ---
  async function handleNameSubmit(e) {
    e.preventDefault();
    if (!nameForm.fullName.trim()) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      const res = await api.patch('/auth/profile', { fullName: nameForm.fullName.trim() });
      // Update stored user data so sidebar name updates immediately
      const updatedUser = { ...user, fullName: res.data.user.full_name, full_name: res.data.user.full_name };
      localStorage.setItem('qlinic_user', JSON.stringify(updatedUser));
      // Trigger AuthContext re-render by re-reading from storage
      window.dispatchEvent(new Event('storage'));
      setNameMsg({ type: 'success', text: 'Nama berhasil diperbarui.' });
    } catch (err) {
      setNameMsg({ type: 'error', text: err.response?.data?.error || 'Gagal memperbarui nama.' });
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMsg(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setPwLoading(true);
    try {
      await api.patch('/auth/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password berhasil diubah.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Gagal mengubah password.' });
    } finally {
      setPwLoading(false);
    }
  }

  function toggleShow(field) {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-description">Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* Profile Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="profile-summary">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <div className="profile-summary-name">{currentName}</div>
              <div className="profile-summary-meta">
                <span className="profile-role-badge">{roleLabels[user?.role]}</span>
                {user?.email && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.email}</span>}
                {user?.phone_number && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.phone_number}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Edit Name */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Informasi Pribadi
            </div>
          </div>
          <div className="card-body">
            {nameMsg && (
              <div className={`alert alert-${nameMsg.type === 'success' ? 'success' : 'error'}`}>
                {nameMsg.type === 'success' ? '✓' : '✕'} {nameMsg.text}
              </div>
            )}
            <form onSubmit={handleNameSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  className="form-input"
                  type="text"
                  value={nameForm.fullName}
                  onChange={e => setNameForm({ fullName: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                  minLength={2}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.email || '—'}
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nomor Telepon</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.phone_number || user?.phoneNumber || '—'}
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={nameLoading || !nameForm.fullName.trim() || nameForm.fullName.trim() === currentName}
                >
                  {nameLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Ubah Password
            </div>
          </div>
          <div className="card-body">
            {pwMsg && (
              <div className={`alert alert-${pwMsg.type === 'success' ? 'success' : 'error'}`}>
                {pwMsg.type === 'success' ? '✓' : '✕'} {pwMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Password Saat Ini</label>
                <div className="password-input-wrapper">
                  <input
                    className="form-input"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Masukkan password saat ini"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => toggleShow('current')} tabIndex={-1}>
                    {showPasswords.current ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <div className="password-input-wrapper">
                  <input
                    className="form-input"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                  />
                  <button type="button" className="password-toggle" onClick={() => toggleShow('new')} tabIndex={-1}>
                    {showPasswords.new ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {pwForm.newPassword.length > 0 && (
                  <PasswordStrength password={pwForm.newPassword} />
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Konfirmasi Password Baru</label>
                <div className="password-input-wrapper">
                  <input
                    className="form-input"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Ulangi password baru"
                    required
                    style={
                      pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                        ? { borderColor: '#888' }
                        : {}
                    }
                  />
                  <button type="button" className="password-toggle" onClick={() => toggleShow('confirm')} tabIndex={-1}>
                    {showPasswords.confirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>Password tidak cocok</p>
                )}
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    pwLoading ||
                    !pwForm.currentPassword ||
                    !pwForm.newPassword ||
                    !pwForm.confirmPassword ||
                    pwForm.newPassword !== pwForm.confirmPassword
                  }
                >
                  {pwLoading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function PasswordStrength({ password }) {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const levels = [
    { label: 'Sangat Lemah', color: '#ccc' },
    { label: 'Lemah', color: '#bbb' },
    { label: 'Cukup', color: '#999' },
    { label: 'Kuat', color: '#666' },
    { label: 'Sangat Kuat', color: '#333' },
  ];
  const level = levels[Math.min(strength, 4)];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {levels.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < strength ? level.color : 'var(--bg-tertiary)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{level.label}</p>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

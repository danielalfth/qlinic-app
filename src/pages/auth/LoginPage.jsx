import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      const routes = { pasien: '/patient/schedule', dokter: '/doctor/patients', admin: '/admin/queue' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/images/logo.png" alt="Qlinic" />
        </div>
        <h1 className="auth-title">Selamat Datang</h1>
        <p className="auth-subtitle">Masuk ke akun Anda untuk melanjutkan</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email atau No. Telepon</label>
            <input
              id="login-identifier"
              className="form-input"
              type="text"
              placeholder="contoh@email.com atau 08xx"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button id="login-submit" className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#777' }}>
          Belum punya akun?{' '}
          <Link to="/signup" style={{ fontWeight: 600, color: '#222' }}>Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}

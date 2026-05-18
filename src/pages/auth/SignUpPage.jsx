import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpPage() {
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', gender: '', age: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok.'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    setLoading(true);
    try {
      await signup({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        age: parseInt(form.age),
        email: form.email || undefined,
        password: form.password,
      });
      navigate('/patient/schedule');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/images/logo.png" alt="Qlinic" /></div>
        <h1 className="auth-title">Daftar Akun Pasien</h1>
        <p className="auth-subtitle">Isi data diri Anda untuk membuat akun</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input className="form-input" name="fullName" placeholder="Nama lengkap" value={form.fullName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">No. Telepon</label>
            <input className="form-input" name="phoneNumber" placeholder="08xxxxxxxxxx" value={form.phoneNumber} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select className="form-select" name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Usia</label>
              <input className="form-input" name="age" type="number" min="0" max="150" placeholder="Usia" value={form.age} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email <span style={{color: '#999', fontWeight: 400, textTransform: 'none'}}>(opsional)</span></label>
            <input className="form-input" name="email" type="email" placeholder="contoh@email.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" name="password" type="password" placeholder="Min. 6 karakter" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi</label>
              <input className="form-input" name="confirmPassword" type="password" placeholder="Ulangi password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#777' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: '#222' }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}

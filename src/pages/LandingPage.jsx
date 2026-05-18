import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function LandingPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/schedules/public')
      .then(res => setDoctors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const shiftLabel = (s) => s === 1 ? 'Pagi (06:00 - 12:00)' : 'Siang (12:00 - 18:00)';

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <img src="/images/logo.png" alt="Qlinic" />
          </div>
          <div className="landing-nav-links">
            <a href="#jadwal">Jadwal Dokter</a>
            <a href="#info">Informasi</a>
            <Link to="/login" className="btn btn-primary btn-sm">Masuk</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">Klinik Umum Terpercaya</div>
          <h1 className="landing-hero-title">
            Layanan Kesehatan<br />
            <span>Profesional & Terjangkau</span>
          </h1>
          <p className="landing-hero-desc">
            Qlinic menyediakan layanan konsultasi dengan dokter umum berpengalaman.
            Kami beroperasi setiap hari kerja dengan dua shift untuk kenyamanan Anda.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="btn btn-primary">Masuk ke Akun</Link>
            <Link to="/signup" className="btn btn-outline">Daftar Sekarang</Link>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-stat">
              <div className="landing-stat-num">4</div>
              <div className="landing-stat-label">Dokter Umum</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">2</div>
              <div className="landing-stat-label">Ruang Periksa</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">2</div>
              <div className="landing-stat-label">Shift per Hari</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">5</div>
              <div className="landing-stat-label">Hari Kerja</div>
            </div>
          </div>
        </div>
      </section>

      {/* Jadwal Dokter */}
      <section className="landing-section" id="jadwal">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-badge">Tim Medis</div>
            <h2 className="landing-section-title">Jadwal Dokter Kami</h2>
            <p className="landing-section-desc">Konsultasikan kesehatan Anda dengan dokter umum kami yang berpengalaman</p>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="doctors-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
              {doctors.map(doc => {
                const shift1 = doc.schedules.find(s => s.shift === 1);
                const shift2 = doc.schedules.find(s => s.shift === 2);
                const room = shift1?.room_name || shift2?.room_name || '-';
                const shift = shift1 ? 1 : 2;

                return (
                  <div className="doctor-card" key={doc.doctor_id}>
                    <img className="doctor-photo" src={doc.photo_url} alt={doc.doctor_name} />
                    <div className="doctor-info">
                      <div className="doctor-name">{doc.doctor_name}</div>
                      <div className="doctor-spec">{doc.specialization}</div>
                      <div className="doctor-detail">
                        <span className="doctor-detail-label">Shift</span>
                        <span className="doctor-detail-value">{shiftLabel(shift)}</span>
                      </div>
                      <div className="doctor-detail">
                        <span className="doctor-detail-label">Ruangan</span>
                        <span className="doctor-detail-value">{room}</span>
                      </div>
                      <div className="doctor-detail">
                        <span className="doctor-detail-label">Kode Antrean</span>
                        <span className="doctor-detail-value" style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{doc.doctor_code}</span>
                      </div>
                      <div className="doctor-detail">
                        <span className="doctor-detail-label">Hari Praktik</span>
                        <span className="doctor-detail-value">Sen - Jum</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Schedule Table */}
          <div className="landing-schedule-table">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Jadwal Mingguan Lengkap</h3>
            <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
              <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shift</th>
                      <th>Jam</th>
                      <th>Ruang 1</th>
                      <th>Ruang 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Shift 1</td>
                      <td>06:00 - 12:00</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {doctors.find(d => d.doctor_code === 'D') && (
                            <img src={doctors.find(d => d.doctor_code === 'D')?.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          Dr. Daniel
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {doctors.find(d => d.doctor_code === 'Z') && (
                            <img src={doctors.find(d => d.doctor_code === 'Z')?.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          Dr. Zaki
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Shift 2</td>
                      <td>12:00 - 18:00</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {doctors.find(d => d.doctor_code === 'A') && (
                            <img src={doctors.find(d => d.doctor_code === 'A')?.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          Dr. Amirah
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {doctors.find(d => d.doctor_code === 'M') && (
                            <img src={doctors.find(d => d.doctor_code === 'M')?.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          Dr. Manda
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="landing-section landing-section-dark" id="info">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>Cara Berobat</div>
            <h2 className="landing-section-title" style={{ color: '#fff' }}>Alur Konsultasi</h2>
            <p className="landing-section-desc" style={{ color: '#999' }}>Langkah-langkah mudah untuk mendapatkan layanan kesehatan kami</p>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Datang ke Klinik</h3>
              <p>Kunjungi Qlinic pada jam operasional (06:00 - 18:00, Senin - Jumat)</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Daftar di Resepsionis</h3>
              <p>Admin akan mencatat keluhan Anda dan memasukkan ke antrean dokter</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Tunggu Panggilan</h3>
              <p>Pantau nomor antrean Anda secara realtime melalui akun pasien</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-num">4</div>
              <h3>Konsultasi Dokter</h3>
              <p>Masuk ke ruang periksa saat nomor Anda dipanggil oleh dokter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>Siap Berkonsultasi?</h2>
          <p style={{ color: '#777', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Daftar akun untuk memantau jadwal dokter, status antrean, dan riwayat rekam medis Anda.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/signup" className="btn btn-primary">Daftar Akun Pasien</Link>
            <Link to="/login" className="btn btn-outline">Sudah Punya Akun</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <img src="/images/logo.png" alt="Qlinic" style={{ height: 32, filter: 'brightness(10)' }} />
              <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 8 }}>Sistem Manajemen Klinik</p>
            </div>
            <div className="landing-footer-info">
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                Jam Operasional: Senin - Jumat, 06:00 - 18:00 WIB
              </p>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>© 2026 Qlinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

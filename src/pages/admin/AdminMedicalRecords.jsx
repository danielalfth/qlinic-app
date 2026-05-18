import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/medical-records').then(res => setRecords(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.queue_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rekam Medis</h1>
        <p className="page-description">Verifikasi administrasi rekam medis pasien (read-only)</p>
      </div>

      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Cari pasien, dokter, atau nomor antrean..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state"><p>{search ? 'Tidak ditemukan.' : 'Belum ada rekam medis.'}</p></div></div></div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Tanggal</th><th>No.</th><th>Pasien</th><th>Dokter</th><th>Diagnosis</th><th></th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <>
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                      <td>{new Date(r.queue_date).toLocaleDateString('id-ID')}</td>
                      <td><strong>{r.queue_number}</strong></td>
                      <td>{r.patient_name}</td>
                      <td>{r.doctor_name}</td>
                      <td>{r.diagnosis?.substring(0, 40)}{r.diagnosis?.length > 40 ? '...' : ''}</td>
                      <td>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"
                          style={{ transform: expanded === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr key={`${r.id}-d`}>
                        <td colSpan="6" style={{ background: '#fafafa', padding: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div><div className="form-label">Pasien</div><p style={{ fontSize: '0.9rem' }}>{r.patient_name} ({r.gender === 'L' ? 'L' : 'P'}, {r.age} thn)</p></div>
                            <div><div className="form-label">Dokter</div><p style={{ fontSize: '0.9rem' }}>{r.doctor_name} — {r.room_name}</p></div>
                            <div><div className="form-label">Keluhan</div><p style={{ fontSize: '0.9rem' }}>{r.complaint || '-'}</p></div>
                            <div><div className="form-label">Pemeriksaan Fisik</div><p style={{ fontSize: '0.9rem' }}>{r.physical_exam || '-'}</p></div>
                            <div><div className="form-label">Diagnosis</div><p style={{ fontSize: '0.9rem' }}>{r.diagnosis}</p></div>
                            <div><div className="form-label">Resep Obat</div><p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{r.prescription || '-'}</p></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/medical-records').then(res => setRecords(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rekam Medis</h1>
        <p className="page-description">Riwayat pemeriksaan dan diagnosis Anda</p>
      </div>

      {records.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state"><p>Belum ada rekam medis.</p></div></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {records.map(r => (
            <div className="card" key={r.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded === r.id ? 16 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Kunjungan {r.queue_number}</div>
                    <div style={{ fontSize: '0.8rem', color: '#777' }}>
                      {new Date(r.queue_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {r.doctor_name} — {r.room_name}
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ transform: expanded === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {expanded === r.id && (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {r.complaint && <div><div className="form-label">Keluhan</div><p style={{ fontSize: '0.9rem' }}>{r.complaint}</p></div>}
                    {r.physical_exam && <div><div className="form-label">Pemeriksaan Fisik</div><p style={{ fontSize: '0.9rem' }}>{r.physical_exam}</p></div>}
                    <div><div className="form-label">Diagnosis</div><p style={{ fontSize: '0.9rem' }}>{r.diagnosis}</p></div>
                    {r.prescription && <div><div className="form-label">Resep Obat</div><p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{r.prescription}</p></div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

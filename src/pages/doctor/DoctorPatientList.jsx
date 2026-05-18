import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const statusClass = {
  'Menunggu': 'status-menunggu', 'Diperiksa': 'status-diperiksa',
  'Selesai': 'status-selesai', 'Dilewati': 'status-dilewati', 'Dibatalkan': 'status-dibatalkan',
};

export default function DoctorPatientList() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showMedForm, setShowMedForm] = useState(null);
  const [medForm, setMedForm] = useState({ physicalExam: '', diagnosis: '', prescription: '' });
  const [msg, setMsg] = useState('');

  const fetchQueues = useCallback(async () => {
    try { const res = await api.get('/queues'); setQueues(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);
  useAutoRefresh(fetchQueues, 5000);

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try { await api.patch(`/queues/${id}/status`, { status }); fetchQueues(); }
    catch (err) { alert(err.response?.data?.error || 'Gagal mengubah status.'); }
    finally { setActionLoading(null); }
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medical-records', { queueId: showMedForm, ...medForm });
      setMsg('Rekam medis berhasil disimpan.');
      setShowMedForm(null);
      setMedForm({ physicalExam: '', diagnosis: '', prescription: '' });
      fetchQueues();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.error || 'Gagal menyimpan.'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const waiting = queues.filter(q => q.status === 'Menunggu');
  const examining = queues.filter(q => q.status === 'Diperiksa');
  const done = queues.filter(q => ['Selesai', 'Dilewati', 'Dibatalkan'].includes(q.status));

  const stats = [
    { label: 'Menunggu', value: waiting.length, icon: '⏳' },
    { label: 'Diperiksa', value: examining.length, icon: '🔍' },
    { label: 'Selesai', value: queues.filter(q => q.status === 'Selesai').length, icon: '✓' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Daftar Pasien</h1><p className="page-description">Antrean pasien shift Anda hari ini</p></div>
        <div className="refresh-indicator"><span className="refresh-dot" />Auto-refresh aktif</div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Currently Examining */}
      {examining.length > 0 && (
        <div className="queue-section">
          <div className="queue-section-title">🔍 Sedang Diperiksa</div>
          <div className="queue-list">
            {examining.map(q => (
              <div className="queue-item active" key={q.id}>
                <div className="queue-number">{q.queue_number}</div>
                <div className="queue-patient-info">
                  <div className="queue-patient-name">{q.patient_name}</div>
                  <div className="queue-patient-detail">{q.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {q.age} thn{q.complaint ? ` — ${q.complaint}` : ''}</div>
                </div>
                <div className="queue-actions">
                  {!q.has_medical_record && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowMedForm(q.id)}>Isi Rekam Medis</button>
                  )}
                  <button className="btn btn-secondary btn-sm" disabled={actionLoading === q.id || !q.has_medical_record}
                    onClick={() => updateStatus(q.id, 'Selesai')}>
                    {q.has_medical_record ? 'Selesai' : 'Isi RM dulu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      {waiting.length > 0 && (
        <div className="queue-section">
          <div className="queue-section-title">⏳ Menunggu ({waiting.length})</div>
          <div className="queue-list">
            {waiting.map(q => (
              <div className="queue-item" key={q.id}>
                <div className="queue-number">{q.queue_number}</div>
                <div className="queue-patient-info">
                  <div className="queue-patient-name">{q.patient_name}</div>
                  <div className="queue-patient-detail">{q.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {q.age} thn{q.complaint ? ` — ${q.complaint}` : ''}</div>
                </div>
                <div className="queue-actions">
                  <button className="btn btn-primary btn-sm" disabled={actionLoading === q.id || examining.length > 0}
                    onClick={() => updateStatus(q.id, 'Diperiksa')}>Panggil</button>
                  <button className="btn btn-outline btn-sm" disabled={actionLoading === q.id}
                    onClick={() => updateStatus(q.id, 'Dilewati')}>Lewati</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="queue-section">
          <div className="queue-section-title">Selesai ({done.length})</div>
          <div className="queue-list">
            {done.map(q => (
              <div className="queue-item" key={q.id} style={{ opacity: 0.6 }}>
                <div className="queue-number">{q.queue_number}</div>
                <div className="queue-patient-info">
                  <div className="queue-patient-name">{q.patient_name}</div>
                  <div className="queue-patient-detail">{q.complaint || '-'}</div>
                </div>
                <span className={`status-badge ${statusClass[q.status]}`}><span className="status-dot"/>{q.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {queues.length === 0 && <div className="card"><div className="card-body"><div className="empty-state"><p>Belum ada pasien dalam antrean hari ini.</p></div></div></div>}

      {/* Medical Record Modal */}
      {showMedForm && (
        <div className="modal-overlay" onClick={() => setShowMedForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Rekam Medis — {queues.find(q => q.id === showMedForm)?.patient_name}</div>
              <button className="modal-close" onClick={() => setShowMedForm(null)}>×</button>
            </div>
            <form onSubmit={handleMedSubmit}>
              <div className="modal-body medical-form">
                <div className="form-group">
                  <label className="form-label">Pemeriksaan Fisik</label>
                  <textarea placeholder="Tekanan darah, suhu, dll." value={medForm.physicalExam}
                    onChange={e => setMedForm({...medForm, physicalExam: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis *</label>
                  <textarea placeholder="Hasil diagnosis" value={medForm.diagnosis}
                    onChange={e => setMedForm({...medForm, diagnosis: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Resep Obat</label>
                  <textarea placeholder="Daftar obat dan dosis" value={medForm.prescription}
                    onChange={e => setMedForm({...medForm, prescription: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMedForm(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Rekam Medis</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

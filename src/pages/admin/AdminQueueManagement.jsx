import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const statusClass = {
  'Menunggu': 'status-menunggu', 'Diperiksa': 'status-diperiksa',
  'Selesai': 'status-selesai', 'Dilewati': 'status-dilewati', 'Dibatalkan': 'status-dibatalkan',
};

export default function AdminQueueManagement() {
  const [queues, setQueues] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [complaint, setComplaint] = useState('');
  const [msg, setMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([api.get('/queues'), api.get('/schedules/today')]);
      setQueues(qRes.data);
      setSchedules(sRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, 5000);

  const searchPatients = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/queues/patients/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const addQueue = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedSchedule) return;
    try {
      const res = await api.post('/queues', { patientId: selectedPatient.id, scheduleId: parseInt(selectedSchedule), complaint });
      setMsg(res.data.message);
      setShowAddModal(false);
      resetForm();
      fetchData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { alert(err.response?.data?.error || 'Gagal mendaftarkan.'); }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try { await api.patch(`/queues/${id}/status`, { status }); fetchData(); }
    catch (err) { alert(err.response?.data?.error || 'Gagal.'); }
    finally { setActionLoading(null); }
  };

  const resetForm = () => { setSearchQuery(''); setSearchResults([]); setSelectedPatient(null); setSelectedSchedule(''); setComplaint(''); };

  const shiftLabel = (s) => s === 1 ? 'Pagi' : 'Siang';

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // Group queues by room
  const rooms = {};
  queues.forEach(q => {
    if (!rooms[q.room_name]) rooms[q.room_name] = [];
    rooms[q.room_name].push(q);
  });

  const totalWaiting = queues.filter(q => q.status === 'Menunggu').length;
  const totalExamining = queues.filter(q => q.status === 'Diperiksa').length;
  const totalDone = queues.filter(q => q.status === 'Selesai').length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div><h1 className="page-title">Manajemen Antrean</h1><p className="page-description">Pusat kendali antrean pasien hari ini</p></div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="refresh-indicator"><span className="refresh-dot" />Live</div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Tambah Antrean</button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📋</div><div><div className="stat-value">{queues.length}</div><div className="stat-label">Total Antrean</div></div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div><div className="stat-value">{totalWaiting}</div><div className="stat-label">Menunggu</div></div></div>
        <div className="stat-card"><div className="stat-icon">🔍</div><div><div className="stat-value">{totalExamining}</div><div className="stat-label">Diperiksa</div></div></div>
        <div className="stat-card"><div className="stat-icon">✓</div><div><div className="stat-value">{totalDone}</div><div className="stat-label">Selesai</div></div></div>
      </div>

      {/* Dual Room View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {Object.entries(rooms).map(([roomName, roomQueues]) => (
          <div className="card" key={roomName}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{roomName}</span>
              <span style={{ fontSize: '0.8rem', color: '#777' }}>{roomQueues[0]?.doctor_name} — Shift {shiftLabel(roomQueues[0]?.shift)}</span>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              {roomQueues.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}><p>Belum ada antrean</p></div>
              ) : (
                <div className="queue-list">
                  {roomQueues.map(q => (
                    <div className="queue-item" key={q.id} style={{ padding: '12px 14px' }}>
                      <div className="queue-number" style={{ fontSize: '1.1rem' }}>{q.queue_number}</div>
                      <div className="queue-patient-info">
                        <div className="queue-patient-name" style={{ fontSize: '0.85rem' }}>{q.patient_name}</div>
                        <div className="queue-patient-detail" style={{ fontSize: '0.75rem' }}>{q.complaint || '-'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span className={`status-badge ${statusClass[q.status]}`} style={{ fontSize: '0.7rem' }}>
                          <span className="status-dot"/>{q.status}
                        </span>
                        {q.status === 'Menunggu' && (
                          <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            disabled={actionLoading === q.id} onClick={() => updateStatus(q.id, 'Dibatalkan')}>Batal</button>
                        )}
                        {q.status === 'Dilewati' && (
                          <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            disabled={actionLoading === q.id} onClick={() => updateStatus(q.id, 'Menunggu')}>Kembalikan</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {Object.keys(rooms).length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}><div className="card-body"><div className="empty-state"><p>Belum ada antrean hari ini.</p></div></div></div>
        )}
      </div>

      {/* Add Queue Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tambah Antrean Baru</div>
              <button className="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={addQueue}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cari Pasien</label>
                  <div className="search-bar" style={{ marginBottom: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input placeholder="Ketik nama atau no. telepon..." value={searchQuery}
                      onChange={e => searchPatients(e.target.value)} />
                    {searchResults.length > 0 && !selectedPatient && (
                      <div className="search-results">
                        {searchResults.map(p => (
                          <div className="search-result-item" key={p.id}
                            onClick={() => { setSelectedPatient(p); setSearchQuery(p.full_name); setSearchResults([]); }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>{p.phone_number} — {p.gender === 'L' ? 'L' : 'P'}, {p.age} thn</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPatient && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{selectedPatient.full_name}</strong> — {selectedPatient.phone_number}</span>
                      <button type="button" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
                        onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}>×</button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Pilih Dokter / Jadwal</label>
                  <select className="form-select" value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)} required>
                    <option value="">Pilih dokter...</option>
                    {schedules.filter(s => s.remaining_quota > 0).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.doctor_name} — {s.room_name} — Shift {shiftLabel(s.shift)} ({s.remaining_quota} slot)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Keluhan</label>
                  <input className="form-input" placeholder="Keluhan pasien (opsional)" value={complaint} onChange={e => setComplaint(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedPatient || !selectedSchedule}>Daftarkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

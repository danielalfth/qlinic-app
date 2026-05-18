import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const statusClass = {
  'Menunggu': 'status-menunggu',
  'Diperiksa': 'status-diperiksa',
  'Selesai': 'status-selesai',
  'Dilewati': 'status-dilewati',
  'Dibatalkan': 'status-dibatalkan',
};

export default function PatientQueue() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await api.get('/queues');
      setQueues(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);
  useAutoRefresh(fetchQueues, 5000);

  const shiftLabel = (s) => s === 1 ? '06:00 - 12:00' : '12:00 - 18:00';

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const activeQueue = queues.find(q => q.status === 'Menunggu' || q.status === 'Diperiksa');

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Status Antrean</h1>
          <p className="page-description">Pantau status antrean Anda secara realtime</p>
        </div>
        <div className="refresh-indicator">
          <span className="refresh-dot" />
          Auto-refresh aktif
        </div>
      </div>

      {activeQueue ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div className="queue-status-display">
              <div className={`status-badge ${statusClass[activeQueue.status]}`} style={{ marginBottom: 16, fontSize: '0.85rem' }}>
                <span className="status-dot" />
                {activeQueue.status}
              </div>
              <div className="queue-big-number">{activeQueue.queue_number}</div>
              <div className="queue-status-info">
                <div className="queue-info-item">
                  <div className="queue-info-label">Dokter</div>
                  <div className="queue-info-value">{activeQueue.doctor_name}</div>
                </div>
                <div className="queue-info-item">
                  <div className="queue-info-label">Ruangan</div>
                  <div className="queue-info-value">{activeQueue.room_name}</div>
                </div>
                <div className="queue-info-item">
                  <div className="queue-info-label">Jam Praktik</div>
                  <div className="queue-info-value">{shiftLabel(activeQueue.shift)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div className="empty-state">
              <p>Anda belum memiliki antrean aktif hari ini.</p>
              <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Silakan datang ke klinik untuk mendaftar melalui admin.</p>
            </div>
          </div>
        </div>
      )}

      {queues.length > 0 && (
        <div className="card">
          <div className="card-header">Riwayat Antrean Hari Ini</div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>No. Antrean</th><th>Dokter</th><th>Ruangan</th><th>Status</th></tr>
              </thead>
              <tbody>
                {queues.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.queue_number}</strong></td>
                    <td>{q.doctor_name}</td>
                    <td>{q.room_name}</td>
                    <td><span className={`status-badge ${statusClass[q.status]}`}><span className="status-dot"/>{q.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

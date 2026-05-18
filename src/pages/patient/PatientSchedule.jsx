import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PatientSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schedules/today').then(res => setSchedules(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shiftLabel = (s) => s === 1 ? 'Pagi (06:00 - 12:00)' : 'Siang (12:00 - 18:00)';

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Jadwal Dokter</h1>
        <p className="page-description">Ketersediaan dokter dan sisa kuota hari ini</p>
      </div>

      {schedules.length === 0 ? (
        <div className="empty-state"><p>Tidak ada jadwal dokter hari ini (akhir pekan).</p></div>
      ) : (
        <div className="doctors-grid">
          {schedules.map((s) => (
            <div className="doctor-card" key={s.id}>
              <img className="doctor-photo" src={s.photo_url} alt={s.doctor_name} />
              <div className="doctor-info">
                <div className="doctor-name">{s.doctor_name}</div>
                <div className="doctor-spec">{s.specialization}</div>
                <div className="doctor-detail">
                  <span className="doctor-detail-label">Shift</span>
                  <span className="doctor-detail-value">{shiftLabel(s.shift)}</span>
                </div>
                <div className="doctor-detail">
                  <span className="doctor-detail-label">Ruangan</span>
                  <span className="doctor-detail-value">{s.room_name}</span>
                </div>
                <div className="doctor-detail">
                  <span className="doctor-detail-label">Sisa Kuota</span>
                  <span className={`quota-badge ${s.remaining_quota > 0 ? 'quota-available' : 'quota-full'}`}>
                    {s.remaining_quota > 0 ? `${s.remaining_quota} tersisa` : 'Penuh'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

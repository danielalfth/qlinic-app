import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');

  useEffect(() => {
    Promise.all([
      api.get('/schedules'),
      api.get('/schedules/today'),
    ]).then(([all, today]) => {
      setSchedules(all.data);
      setTodaySchedules(today.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shiftLabel = (s) => s === 1 ? 'Pagi (06:00 - 12:00)' : 'Siang (12:00 - 18:00)';
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Jadwal Dokter</h1>
        <p className="page-description">Pantau jadwal dan kuota seluruh dokter</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>Hari Ini</button>
        <button className={`tab ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>Mingguan</button>
      </div>

      {tab === 'today' ? (
        todaySchedules.length === 0 ? (
          <div className="card"><div className="card-body"><div className="empty-state"><p>Tidak ada jadwal hari ini (akhir pekan).</p></div></div></div>
        ) : (
          <div className="doctors-grid">
            {todaySchedules.map(s => (
              <div className="doctor-card" key={s.id}>
                <img className="doctor-photo" src={s.photo_url} alt={s.doctor_name} />
                <div className="doctor-info">
                  <div className="doctor-name">{s.doctor_name}</div>
                  <div className="doctor-spec">{s.specialization}</div>
                  <div className="doctor-detail"><span className="doctor-detail-label">Shift</span><span className="doctor-detail-value">{shiftLabel(s.shift)}</span></div>
                  <div className="doctor-detail"><span className="doctor-detail-label">Ruangan</span><span className="doctor-detail-value">{s.room_name}</span></div>
                  <div className="doctor-detail"><span className="doctor-detail-label">Sisa Kuota</span>
                    <span className={`quota-badge ${s.remaining_quota > 0 ? 'quota-available' : 'quota-full'}`}>
                      {s.remaining_quota > 0 ? `${s.remaining_quota} / ${s.max_quota}` : 'Penuh'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Hari</th><th>Shift</th><th>Dokter</th><th>Ruangan</th><th>Kuota</th></tr></thead>
              <tbody>
                {days.map(day => {
                  const ds = schedules.filter(s => s.day_of_week === day);
                  return ds.map((s, i) => (
                    <tr key={s.id}>
                      {i === 0 && <td rowSpan={ds.length} style={{ fontWeight: 600, verticalAlign: 'middle' }}>{day}</td>}
                      <td>{shiftLabel(s.shift)}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={s.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />{s.doctor_name}
                      </td>
                      <td>{s.room_name}</td>
                      <td>{s.max_quota} pasien</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

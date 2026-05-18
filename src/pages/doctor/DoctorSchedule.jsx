import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DoctorSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schedules').then(res => setSchedules(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shiftLabel = (s) => s === 1 ? 'Pagi (06:00 - 12:00)' : 'Siang (12:00 - 18:00)';
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Jadwal Dokter</h1>
        <p className="page-description">Jadwal praktik mingguan seluruh dokter</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Hari</th><th>Shift</th><th>Dokter</th><th>Ruangan</th><th>Kuota Maks.</th></tr>
            </thead>
            <tbody>
              {days.map(day => {
                const daySchedules = schedules.filter(s => s.day_of_week === day);
                return daySchedules.map((s, i) => (
                  <tr key={s.id}>
                    {i === 0 && <td rowSpan={daySchedules.length} style={{ fontWeight: 600, verticalAlign: 'middle' }}>{day}</td>}
                    <td>{shiftLabel(s.shift)}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={s.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      {s.doctor_name}
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
    </div>
  );
}

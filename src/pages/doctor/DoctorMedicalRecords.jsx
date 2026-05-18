import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DoctorMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ physicalExam: '', diagnosis: '', prescription: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    api.get('/medical-records')
       .then(res => setRecords(res.data))
       .catch(console.error)
       .finally(() => setLoading(false));
  };

  const handleEditClick = (record, e) => {
    e.stopPropagation();
    setEditingId(record.id);
    setEditForm({
      physicalExam: record.physical_exam || '',
      diagnosis: record.diagnosis || '',
      prescription: record.prescription || ''
    });
    setExpanded(record.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      setSaving(true);
      await api.put(`/medical-records/${id}`, editForm);
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan rekam medis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rekam Medis</h1>
        <p className="page-description">Riwayat rekam medis pasien Anda</p>
      </div>
      {records.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state"><p>Belum ada rekam medis.</p></div></div></div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Tanggal</th><th>No. Antrean</th><th>Pasien</th><th>Diagnosis</th><th></th></tr></thead>
              <tbody>
                {records.map(r => (
                  <React.Fragment key={r.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => {
                        if (editingId !== r.id) {
                          setExpanded(expanded === r.id ? null : r.id);
                        }
                      }}>
                      <td>{new Date(r.queue_date).toLocaleDateString('id-ID')}</td>
                      <td><strong>{r.queue_number}</strong></td>
                      <td>{r.patient_name}</td>
                      <td>{r.diagnosis?.substring(0, 50)}{r.diagnosis?.length > 50 ? '...' : ''}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button onClick={(e) => handleEditClick(r, e)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Edit</button>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"
                            style={{ transform: expanded === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr>
                        <td colSpan="5" style={{ background: '#fafafa', padding: 20 }}>
                          {editingId === r.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #eaeaea', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ gridColumn: '1 / -1', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 8 }}>Informasi Awal</div>
                                <div><div className="form-label" style={{ color: '#888' }}>Pasien</div><p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>{r.patient_name} ({r.gender === 'L' ? 'L' : 'P'}, {r.age} thn)</p></div>
                                <div><div className="form-label" style={{ color: '#888' }}>Keluhan Utama</div><p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>{r.complaint || '-'}</p></div>
                              </div>
                              
                              <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #b3e5fc', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontWeight: '600', color: '#0288d1', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                  Edit Rekam Medis
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                  <div>
                                    <label className="form-label" style={{ fontWeight: '500' }}>Pemeriksaan Fisik</label>
                                    <textarea className="form-control" value={editForm.physicalExam} onChange={e => setEditForm({...editForm, physicalExam: e.target.value})} rows="3" placeholder="Contoh: TD 120/80, Nadi 80x/mnt, Suhu 36.5C..." style={{ resize: 'vertical' }} />
                                  </div>
                                  <div>
                                    <label className="form-label" style={{ fontWeight: '500' }}>Diagnosis <span style={{color:'red'}}>*</span></label>
                                    <textarea className="form-control" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} rows="3" placeholder="Masukkan diagnosis pasien..." style={{ resize: 'vertical' }} />
                                  </div>
                                  <div>
                                    <label className="form-label" style={{ fontWeight: '500' }}>Resep Obat</label>
                                    <textarea className="form-control" value={editForm.prescription} onChange={e => setEditForm({...editForm, prescription: e.target.value})} rows="3" placeholder="Tuliskan resep obat untuk apotek..." style={{ resize: 'vertical' }} />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #eaeaea' }}>
                                  <button className="btn btn-secondary" onClick={handleCancelEdit} disabled={saving} style={{ padding: '8px 24px' }}>Batal</button>
                                  <button className="btn btn-primary" onClick={() => handleSaveEdit(r.id)} disabled={saving || !editForm.diagnosis.trim()} style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {saving ? (
                                      <>Menyimpan...</>
                                    ) : (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                        Simpan Perubahan
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div><div className="form-label" style={{ color: '#888' }}>Pasien</div><p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>{r.patient_name} ({r.gender === 'L' ? 'L' : 'P'}, {r.age} thn)</p></div>
                                <div><div className="form-label" style={{ color: '#888' }}>Keluhan</div><p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>{r.complaint || '-'}</p></div>
                              </div>
                              <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #eaeaea', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div><div className="form-label" style={{ color: '#888' }}>Pemeriksaan Fisik</div><p style={{ fontSize: '0.95rem', margin: 0 }}>{r.physical_exam || '-'}</p></div>
                                <div><div className="form-label" style={{ color: '#888' }}>Diagnosis</div><p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#333' }}>{r.diagnosis}</p></div>
                                <div style={{ gridColumn: '1 / -1' }}><div className="form-label" style={{ color: '#888' }}>Resep Obat</div><p style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>{r.prescription || '-'}</p></div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

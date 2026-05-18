import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';
import { generateQueueNumber, getRemainingQuota } from '../utils/queueHelper.js';

const router = Router();

// GET /api/queues — role-based queue list
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, id } = req.user;
    const queryDate = req.query.date || new Date().toISOString().split('T')[0];
    let query, params;

    if (role === 'pasien') {
      query = `SELECT q.id, q.queue_number, q.status, q.complaint, q.queue_date, q.created_at,
        p.full_name as patient_name, p.gender, p.age,
        d.full_name as doctor_name, d.doctor_code, d.photo_url,
        s.shift, s.max_quota, r.room_name,
        CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as has_medical_record
        FROM queues q JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id LEFT JOIN medical_records mr ON mr.queue_id = q.id
        WHERE q.patient_id = $1 AND q.queue_date = $2 ORDER BY q.created_at DESC`;
      params = [id, queryDate];
    } else if (role === 'dokter') {
      query = `SELECT q.id, q.queue_number, q.status, q.complaint, q.queue_date, q.created_at,
        p.full_name as patient_name, p.gender, p.age, p.account_id as patient_id,
        d.full_name as doctor_name, d.doctor_code, s.shift, s.max_quota, r.room_name,
        CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as has_medical_record
        FROM queues q JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id LEFT JOIN medical_records mr ON mr.queue_id = q.id
        WHERE s.doctor_id = $1 AND q.queue_date = $2 ORDER BY q.queue_number ASC`;
      params = [id, queryDate];
    } else {
      query = `SELECT q.id, q.queue_number, q.status, q.complaint, q.queue_date, q.created_at,
        p.full_name as patient_name, p.gender, p.age, p.account_id as patient_id,
        d.full_name as doctor_name, d.doctor_code, d.photo_url,
        s.shift, s.max_quota, s.id as schedule_id, r.room_name,
        CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as has_medical_record
        FROM queues q JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id LEFT JOIN medical_records mr ON mr.queue_id = q.id
        WHERE q.queue_date = $1 ORDER BY s.shift, r.room_name, q.queue_number ASC`;
      params = [queryDate];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get queues error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/queues/patients/search — admin searches patients
router.get('/patients/search', authenticate, rbac('admin'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Min 2 karakter.' });
    const result = await pool.query(
      `SELECT a.id, a.email, a.phone_number, p.full_name, p.gender, p.age
       FROM accounts a JOIN patient_details p ON a.id = p.account_id
       WHERE a.role = 'pasien' AND (LOWER(p.full_name) LIKE LOWER($1) OR a.phone_number LIKE $1) LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search patients error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/queues — admin creates queue entry
router.post('/', authenticate, rbac('admin'), async (req, res) => {
  try {
    const { patientId, scheduleId, complaint } = req.body;
    if (!patientId || !scheduleId) return res.status(400).json({ error: 'ID Pasien dan Jadwal wajib.' });
    const today = new Date().toISOString().split('T')[0];

    const patientCheck = await pool.query('SELECT account_id FROM patient_details WHERE account_id = $1', [patientId]);
    if (patientCheck.rows.length === 0) return res.status(404).json({ error: 'Pasien tidak ditemukan.' });

    const remaining = await getRemainingQuota(scheduleId, today);
    if (remaining <= 0) return res.status(400).json({ error: 'Kuota dokter sudah penuh.' });

    const dup = await pool.query(
      `SELECT id FROM queues WHERE patient_id=$1 AND schedule_id=$2 AND queue_date=$3 AND status!='Dibatalkan'`,
      [patientId, scheduleId, today]
    );
    if (dup.rows.length > 0) return res.status(400).json({ error: 'Pasien sudah terdaftar di antrean ini.' });

    const sched = await pool.query('SELECT doctor_id FROM schedules WHERE id = $1', [scheduleId]);
    if (sched.rows.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

    const queueNumber = await generateQueueNumber(sched.rows[0].doctor_id, today);
    const result = await pool.query(
      `INSERT INTO queues (patient_id, schedule_id, queue_number, status, complaint, queue_date)
       VALUES ($1,$2,$3,'Menunggu',$4,$5) RETURNING *`,
      [patientId, scheduleId, queueNumber, complaint || null, today]
    );
    res.status(201).json({ message: `Antrean ${queueNumber} berhasil dibuat.`, queue: result.rows[0] });
  } catch (err) {
    console.error('Create queue error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/queues/:id/status — update queue status
router.patch('/:id/status', authenticate, rbac('admin', 'dokter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['Menunggu', 'Diperiksa', 'Selesai', 'Dilewati', 'Dibatalkan'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });

    const qr = await pool.query('SELECT * FROM queues WHERE id = $1', [id]);
    if (qr.rows.length === 0) return res.status(404).json({ error: 'Antrean tidak ditemukan.' });

    const transitions = {
      'Menunggu': ['Diperiksa', 'Dilewati', 'Dibatalkan'],
      'Diperiksa': ['Selesai'],
      'Dilewati': ['Menunggu'],
      'Selesai': [], 'Dibatalkan': [],
    };
    if (!transitions[qr.rows[0].status]?.includes(status)) {
      return res.status(400).json({ error: `Tidak dapat ubah dari "${qr.rows[0].status}" ke "${status}".` });
    }

    const result = await pool.query('UPDATE queues SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
    res.json({ message: `Status diubah ke "${status}".`, queue: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;

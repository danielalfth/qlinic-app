import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { role, id } = req.user;
    const { patientId, queueId } = req.query;
    let query = '';
    let params = [];

    if (queueId) {
      query = `
        SELECT mr.*, q.queue_number, q.queue_date, q.complaint,
          p.full_name as patient_name, p.gender, p.age,
          d.full_name as doctor_name, r.room_name, s.shift
        FROM medical_records mr
        JOIN queues q ON mr.queue_id = q.id
        JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id
        JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id
        WHERE mr.queue_id = $1
      `;
      params = [queueId];
      if (role === 'pasien') { query += ' AND q.patient_id = $2'; params.push(id); }
    } else if (role === 'pasien') {
      query = `
        SELECT mr.*, q.queue_number, q.queue_date, q.complaint,
          d.full_name as doctor_name, r.room_name, s.shift
        FROM medical_records mr
        JOIN queues q ON mr.queue_id = q.id
        JOIN schedules s ON q.schedule_id = s.id
        JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id
        WHERE q.patient_id = $1
        ORDER BY q.queue_date DESC
      `;
      params = [id];
    } else if (role === 'dokter') {
      query = `
        SELECT mr.*, q.queue_number, q.queue_date, q.complaint,
          p.full_name as patient_name, p.gender, p.age,
          r.room_name, s.shift
        FROM medical_records mr
        JOIN queues q ON mr.queue_id = q.id
        JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.doctor_id = $1
        ORDER BY q.queue_date DESC
      `;
      params = [id];
    } else {
      query = `
        SELECT mr.*, q.queue_number, q.queue_date, q.complaint,
          p.full_name as patient_name, p.gender, p.age,
          d.full_name as doctor_name, r.room_name, s.shift
        FROM medical_records mr
        JOIN queues q ON mr.queue_id = q.id
        JOIN patient_details p ON q.patient_id = p.account_id
        JOIN schedules s ON q.schedule_id = s.id
        JOIN doctor_details d ON s.doctor_id = d.account_id
        JOIN rooms r ON s.room_id = r.id
        ORDER BY q.queue_date DESC
        LIMIT 100
      `;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get medical records error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/', authenticate, rbac('dokter'), async (req, res) => {
  try {
    const { queueId, physicalExam, diagnosis, prescription } = req.body;
    if (!queueId || !diagnosis) {
      return res.status(400).json({ error: 'Queue ID dan diagnosis wajib diisi.' });
    }
    const queueCheck = await pool.query(
      `SELECT q.id, q.status, s.doctor_id FROM queues q
       JOIN schedules s ON q.schedule_id = s.id WHERE q.id = $1`, [queueId]
    );
    if (queueCheck.rows.length === 0) return res.status(404).json({ error: 'Antrean tidak ditemukan.' });
    if (queueCheck.rows[0].doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya bisa mengisi rekam medis pasien Anda.' });
    }
    const existing = await pool.query('SELECT id FROM medical_records WHERE queue_id = $1', [queueId]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Rekam medis sudah ada untuk kunjungan ini.' });

    const result = await pool.query(
      `INSERT INTO medical_records (queue_id, physical_exam, diagnosis, prescription)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [queueId, physicalExam || null, diagnosis, prescription || null]
    );
    res.status(201).json({ message: 'Rekam medis berhasil disimpan.', record: result.rows[0] });
  } catch (err) {
    console.error('Create medical record error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/:id', authenticate, rbac('dokter'), async (req, res) => {
  try {
    const recordId = req.params.id;
    const { physicalExam, diagnosis, prescription } = req.body;
    
    if (!diagnosis) {
      return res.status(400).json({ error: 'Diagnosis wajib diisi.' });
    }

    const recordCheck = await pool.query(
      `SELECT mr.id, s.doctor_id 
       FROM medical_records mr
       JOIN queues q ON mr.queue_id = q.id
       JOIN schedules s ON q.schedule_id = s.id 
       WHERE mr.id = $1`, [recordId]
    );

    if (recordCheck.rows.length === 0) return res.status(404).json({ error: 'Rekam medis tidak ditemukan.' });
    if (recordCheck.rows[0].doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya bisa mengedit rekam medis pasien Anda.' });
    }

    const result = await pool.query(
      `UPDATE medical_records 
       SET physical_exam = $1, diagnosis = $2, prescription = $3
       WHERE id = $4 RETURNING *`,
      [physicalExam || null, diagnosis, prescription || null, recordId]
    );

    res.json({ message: 'Rekam medis berhasil diperbarui.', record: result.rows[0] });
  } catch (err) {
    console.error('Update medical record error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
